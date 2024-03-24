import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import Button from '@mui/material/Button'
import { fetchSpeechToTextFromOpenAI } from '../lib/fetchFromOpenAi';
import { useSelector, useDispatch } from 'react-redux';
import { setTranscript, setShowSpeechOptions } from '../redux/reducers/globalReducer';
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import axios from 'axios';

export function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [timer, setTimer] = useState(null);
    const [speechText, setSpeachText] = useState('')
    const [audioChunks, setAudioChunks] = useState([])

    const dispatch = useDispatch();

    const blobToFile = (blob, fileName) => {
        return new File([blob], fileName, { type: blob.type });
    };

    const startRecording = async () => {
        const recordingIndicator = document.getElementById('recordingIndicator');
        recordingIndicator.style.display = 'block';
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        let lastText = ''
        const audioChunks = [];
        recorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
            setAudioChunks(audioChunks)
        };
        let timer = setInterval(() => {
            recorder.stop();
            recorder.start();
        }, 5000)
        setTimer(timer)
        dispatch(setShowSpeechOptions(false))
        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioFile = blobToFile(audioBlob, "audio.webm");
            const formData = new FormData();
            formData.append('text', "hello world");
            formData.append("file", audioFile);
            formData.append("model", "whisper-1");
            try {
                const response = await fetch('api/speech', {
                    method: 'POST',
                    body: formData,
                })
                const data = await response.json()
                // let nowText = data.text
                // console.log('lastText',lastText);
                // if(lastText.length){
                //     nowText = nowText.slice(lastText.length,nowText.length )
                // }
                // lastText = data.text
                // console.log('nowText',nowText);
                // setSpeachText(nowText)
                setSpeachText(data.text)
                return nowText
            } catch (e) {
                console.error(e)
                // throw new Error('Sorry, there was an error fetching from OpenAI')
            }
        };
        recorder.start();
        setRecording(true);
        setMediaRecorder(recorder);
    };


    const fetchAllText = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = blobToFile(audioBlob, "audio.webm");
        const formData = new FormData();
        formData.append('text', "hello world");
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
            // throw new Error('Sorry, there was an error fetching from OpenAI')
        }
    }

    const stopRecording = () => {
        clearInterval(timer)
        setTimer(null)
        fetchAllText()
        recordingIndicator.style.display = 'none';
        mediaRecorder.stop();
        setRecording(false);
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "20px",
            gap: "20px",
        }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                }}
            >
                <div id="recordingIndicator" className="recording-indicator" style={{ display: "none" }} ></div>
                <Button onClick={recording ? stopRecording : startRecording} onTouchStart={recording ? stopRecording : startRecording} variant="outlined">
                    {recording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </div>
            {speechText && <div>
                <Paper
                    elevation={2}
                    sx={{
                        width: '220px',
                        height: '260px',
                        overflowY:'scroll',
                        padding: 1,
                        borderRadius: '5px',
                        marginRight: '0px',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        // background: 'linear-gradient(to right, #8f41e9, #578aef)',
                        // color: 'black'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            flexWrap: 'wrap',
                        }}
                    >
                        <Typography
                            sx={{ fontWeight: 'bold', color: '#000', margin: '2.5px 5px 5px 5px' }}
                            variant='body2'
                        >
                            {speechText}
                        </Typography>
                    </Box>
                </Paper>
            </div>}
        </div>
    );
}

export default AudioRecorder;
