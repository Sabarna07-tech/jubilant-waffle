from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import jwt
import datetime
from functools import wraps
import os

from services.celery_worker import process_s3_videos_task
from celery.result import AsyncResult
# Import the new S3 stats utility
from services.s3_utils import upload_file_to_s3, list_videos_in_folder, check_file_exists, get_s3_usage_stats, generate_presigned_url

# Mock User Data & Roles
USERS = { "admin": "123", "user": "123", "admin1": "Uploader@123", "viewer": "123" }
ADMIN_ROLES = { "admin": "standard", "user": "standard", "admin1": "s3_uploader", "viewer": "viewer" }
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}

api_bp = Blueprint('api', __name__)

# Helper function to format bytes into KB, MB, GB, etc.
def format_bytes(byte_count):
    if byte_count is None:
        return "0 B"
    power = 1024
    n = 0
    power_labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while byte_count >= power and n < len(power_labels) -1 :
        byte_count /= power
        n += 1
    return f"{byte_count:.2f} {power_labels[n]}B"


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer '):
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Authentication Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            kwargs['current_user'] = data
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired!', 'error': str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Could not verify'}), 401

    username = data['username']
    password = data['password']

    if username in USERS and USERS[username] == password:
        token = jwt.encode({
            'username': username,
            'role': ADMIN_ROLES.get(username, 'user'),
            'exp': datetime.datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")

        return jsonify({'success': True, 'token': token, 'role': ADMIN_ROLES.get(username, 'user')})

    return jsonify({'success': False, 'message': 'Invalid credentials'}), 403

def is_valid_date(date_str):
    try:
        datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        return True
    except ValueError:
        return False

@api_bp.route('/s3-upload', methods=['POST'])
@token_required
def s3_upload(current_user):
    if current_user['role'] != 's3_uploader':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    if 'video' not in request.files:
        return jsonify({'success': False, 'error': 'No video file found in request'}), 400

    file = request.files['video']
    upload_date = request.form.get('upload_date')
    camera_angle = request.form.get('camera_angle')
    video_type = request.form.get('video_type')
    user_name = request.form.get('user_name')

    if not all([file, upload_date, camera_angle, video_type, user_name]):
        return jsonify({'success': False, 'error': 'Missing form data for S3 upload'}), 400
    if not is_valid_date(upload_date):
        return jsonify({'success': False, 'error': 'Invalid upload date format.'}), 400
    
    date_obj = datetime.datetime.strptime(upload_date, "%Y-%m-%d")
    upload_date_str = date_obj.strftime("%d-%m-%Y")
    
    # MODIFIED: The folder path now prepends the base folder from the config
    base_folder = current_app.config['S3_UPLOAD_FOLDER']
    folder_path = os.path.join(
        base_folder,
        upload_date_str,
        user_name,
        'Raw-videos',
        camera_angle,
        video_type
    ).replace("\\", "/")

    success, message, s3_key = upload_file_to_s3(
        file,
        bucket_name=current_app.config['S3_BUCKET'],
        folder_path=folder_path
    )
    return jsonify({'success': success, 'message': message, 's3_key': s3_key})

@api_bp.route('/s3-upload-status', methods=['POST'])
@token_required
def s3_upload_status(current_user):
    data = request.get_json()
    s3_key = data.get('s3_key')

    if not s3_key:
        return jsonify({'success': False, 'error': 'S3 key is missing'}), 400
    
    exists = check_file_exists(
        bucket_name=current_app.config['S3_BUCKET'],
        s3_key=s3_key
    )

    return jsonify({'success': True, 'exists': exists})

@api_bp.route('/get-video-url', methods=['POST'])
@token_required
def get_video_url(current_user):
    data = request.get_json()
    s3_key = data.get('s3_key')

    if not s3_key:
        return jsonify({'success': False, 'error': 'S3 key is missing'}), 400

    presigned_url = generate_presigned_url(
        bucket_name=current_app.config['S3_BUCKET'],
        s3_key=s3_key,
        expiration=3600 # URL is valid for 1 hour
    )

    if not presigned_url:
        return jsonify({'success': False, 'error': 'Could not generate video URL'}), 500

    return jsonify({'success': True, 'url': presigned_url})


@api_bp.route('/retrieve-videos', methods=['POST'])
@token_required
def retrieve_s3_videos(current_user):
    data = request.get_json()
    retrieve_date = data.get('retrieve_date')
    client_id = data.get('client_id')
    camera_angle = data.get('camera_angle')
    video_type = data.get('video_type')

    if not all([retrieve_date, client_id, camera_angle, video_type]):
        return jsonify({'success': False, 'error': 'Missing criteria for video retrieval'}), 400
    
    try:
        date_obj = datetime.datetime.strptime(retrieve_date, "%Y-%m-%d")
        formatted_date = date_obj.strftime("%d-%m-%Y")
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid date format provided.'}), 400

    # MODIFIED: The retrieval path is now consistent with the upload path
    base_folder = current_app.config['S3_UPLOAD_FOLDER']
    s3_prefix = os.path.join(
        base_folder,
        formatted_date,
        client_id,
        'Raw-videos',
        camera_angle,
        video_type
    ).replace("\\", "/") + "/"

    success, folders = list_videos_in_folder(
        bucket_name=current_app.config['S3_BUCKET'],
        prefix=s3_prefix
    )

    if not success:
        return jsonify({'success': False, 'error': folders})
    
    return jsonify({'success': True, 'folders': folders})

@api_bp.route('/process-s3-videos', methods=['POST'])
@token_required
def process_s3_videos(current_user):
    data = request.get_json()
    s3_prefix = data.get('name') 

    if not s3_prefix:
        return jsonify({'success': False, 'error': 'S3 folder prefix is missing.'}), 400

    task = process_s3_videos_task.delay(
        bucket_name=current_app.config['S3_BUCKET'],
        s3_prefix=s3_prefix
    )

    return jsonify({'success': True, 'task_id': task.id}), 202

@api_bp.route('/task-status/<task_id>', methods=['GET'])
@token_required
def task_status(current_user, task_id):
    task = AsyncResult(task_id, app=process_s3_videos_task.app)
    
    response = {'state': task.state}
    if task.state == 'PENDING':
        response.update({'status': 'Pending...', 'progress': 0})
    elif task.state != 'FAILURE':
        response.update(task.info or {})
        if task.state == 'SUCCESS':
            response['result'] = task.result
    else:
        response.update({'status': str(task.info), 'error': True})
        
    return jsonify(response)

@api_bp.route('/system-status', methods=['GET'])
@token_required
def get_system_status(current_user):
    try:
        stats = get_s3_usage_stats(
            bucket_name=current_app.config['S3_BUCKET'],
            prefix=current_app.config['S3_UPLOAD_FOLDER']
        )
        
        return jsonify({
            "total_videos": stats.get('total_videos', 0),
            "storage_usage": format_bytes(stats.get('total_size_bytes', 0)),
            "total_detections": stats.get('total_detections', 0), 
            "processing_speed": "Optimal"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/chart-data', methods=['GET'])
@token_required
def get_chart_data(current_user):
    return jsonify({ "damage_by_date": {"labels": ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], "data": [2, 3, 1, 5, 4]}, "damage_types": {"labels": ['Scratch', 'Dent', 'Crack', 'Rust'], "data": [5, 3, 2, 2]} })