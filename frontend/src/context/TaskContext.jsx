import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { getTaskStatus, processS3Videos } from '../api/apiService';

export const TaskContext = createContext();

export const useTask = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const [taskId, setTaskId] = useState(null);
    const [taskState, setTaskState] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS, FAILURE
    const [taskProgress, setTaskProgress] = useState(0);
    const [taskStatusText, setTaskStatusText] = useState('');
    const [taskResult, setTaskResult] = useState(null);
    const pollIntervalRef = useRef(null);

    const clearTask = () => {
        setTaskId(null);
        setTaskState('IDLE');
        setTaskProgress(0);
        setTaskStatusText('');
        setTaskResult(null);
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const pollTaskStatus = (id) => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        
        pollIntervalRef.current = setInterval(async () => {
            try {
                const data = await getTaskStatus(id);
                setTaskProgress(data.progress || 0);
                setTaskStatusText(data.status || 'Processing...');

                if (data.state === 'SUCCESS') {
                    clearInterval(pollIntervalRef.current);
                    setTaskState('SUCCESS');
                    setTaskResult(data.result);
                } else if (data.state === 'FAILURE') {
                    clearInterval(pollIntervalRef.current);
                    setTaskState('FAILURE');
                    alert('Processing failed: ' + data.status);
                }
            } catch (error) {
                console.error("Polling error:", error);
                clearInterval(pollIntervalRef.current);
                setTaskState('FAILURE');
            }
        }, 2000);
    };

    const startS3FrameExtraction = async (folderToProcess) => {
        if (taskState === 'PROCESSING') {
            alert('A task is already in progress.');
            return;
        }
        
        clearTask();
        setTaskState('PROCESSING');
        setTaskStatusText('Submitting task...');

        try {
            const response = await processS3Videos(folderToProcess);
            if(response.success){
                setTaskId(response.task_id);
                pollTaskStatus(response.task_id);
            } else {
                alert(`Failed to start processing: ${response.error}`);
                setTaskState('FAILURE');
            }
        } catch (error) {
             alert('An error occurred while starting the processing task.');
             console.error(error);
             setTaskState('FAILURE');
        }
    };

    const value = {
        taskId,
        taskState,
        taskProgress,
        taskStatusText,
        taskResult,
        startS3FrameExtraction,
        clearTask
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};