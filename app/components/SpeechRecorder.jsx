import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import Button from '@mui/material/Button'
import { fetchSpeechToTextFromOpenAI } from '../lib/fetchFromOpenAi';
import { useSelector, useDispatch } from 'react-redux';
import { setTranscript, setShowSpeechOptions } from '../redux/reducers/globalReducer';
import axios from 'axios';

export function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const dispatch = useDispatch();

    const blobToFile = (blob, fileName) => {
        return new File([blob], fileName, { type: blob.type });
    };

    const startRecording = async () => {
        const recordingIndicator = document.getElementById('recordingIndicator');
        recordingIndicator.style.display = 'block';

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks = [];

        recorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };

        dispatch(setShowSpeechOptions(false))

        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioFile = blobToFile(audioBlob, "audio.webm");
            const formData = new FormData();
            formData.append('text', "hello world");
            // formData.append('file', audioFile);

            console.log("audioFile: ", audioFile)

            formData.append("file", audioFile);
            formData.append("model", "whisper-1");

            try {
                const response = await fetch('api/speech', {
                    method: 'POST',
                    body: formData,
                })

                const data = await response.json()
                console.log("speech recognition: ", data)
                dispatch(setTranscript(data.text))
                dispatch(setShowSpeechOptions(true))
                return data.text
            } catch (e) {
                console.error(e)
                throw new Error('Sorry, there was an error fetching from OpenAI')
            }
        };

        recorder.start();
        setRecording(true);
        setMediaRecorder(recorder);
    };

    const stopRecording = () => {
        recordingIndicator.style.display = 'none';
        mediaRecorder.stop();
        setRecording(false);
    };

    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            gap: "20px",
        }}>
            <div>
                <div id="recordingIndicator" class="recording-indicator" style={{ display: "none" }} ></div>
            </div>
            <div>
                <Button onClick={recording ? stopRecording : startRecording} onTouchStart={recording ? stopRecording : startRecording} variant="outlined">
                    {recording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </div>
        </div>
    );
}

export default AudioRecorder;
