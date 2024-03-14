'use client'

import * as React from 'react';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The default page is for sign up
export default function Signup() {

    const [username, setUsername] = React.useState('')
    const [roomId, setRoomId] = React.useState('')

    const router = useRouter();

    const redirect
        = () => {
            const attributes = {
                roomId: roomId,
                username: username,
            };
            const queryString = new URLSearchParams(attributes).toString();
            router.push(`/whiteboard?${queryString}`);
        };

    return (
        <Box sx={{
            backgroundColor: 'white',
            width: '100vw',
            height: '100vh',
            m: 0
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
            }}>
                <Box
                    sx={{
                        width: 500,
                        py: 3, // padding top & bottom
                        px: 2, // padding left & right
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        borderRadius: 'sm',
                        boxShadow: 'md',
                    }}
                    variant="outlined"
                >
                    <div>
                        <Typography level="h4" component="h1">
                            <b>Welcome!</b>
                        </Typography>
                        <Typography level="body-sm">Enter information to continue.</Typography>
                    </div>
                    <FormControl>
                        <FormLabel>Username</FormLabel>
                        <Input
                            // html input attribute
                            name="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="username"
                            placeholder="Username"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Room ID</FormLabel>
                        <Input
                            // html input attribute
                            name="room id"
                            required
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            type="text"
                            placeholder="Room ID"
                        />
                    </FormControl>
                    {/* <Link href={{
                        pathname: '/whiteboard',
                        query: { username: username, roomId: roomId },
                    }} >Enter whiteboard</Link> */}
                    <Button sx={{ mt: 1 }} onClick={redirect}>Enter whiteboard</Button>
                </Box>
            </Box>
        </Box>
    );
}