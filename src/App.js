import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { v4 as uuidv4 } from "uuid";
import Authentication from "./Authentication";
import MeetLinkBox from "./MeetLinkBox";
import { Button, Container, Paper, Grid, IconButton } from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  Call,
  CallEnd,
} from "@mui/icons-material";

const App = () => {
  const userVideoRef = useRef();
  const partnerVideoRef = useRef();
  const socket = useRef();
  const [userId, setUserId] = useState("");
  const [callId, setCallId] = useState(null);
  const [callingUser, setCallingUser] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const peer = useRef();

  useEffect(() => {
    socket.current = io("http://localhost:5000"); // Change the URL to your server address

    const urlParams = new URLSearchParams(window.location.search);
    const callIdFromURL = urlParams.get("callId");
    if (callIdFromURL) {
      setCallId(callIdFromURL);
      setUserId(uuidv4());
    }
  }, []);

  useEffect(() => {
    if (userId) {
      socket.current.emit("join", userId);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          userVideoRef.current.srcObject = stream;
        })
        .catch((error) => {
          console.error("Error accessing media devices:", error);
        });

      socket.current.on("userJoined", (user) => {
        console.log(`User ${user} joined the room.`);
      });

      socket.current.on("callRequest", (from) => {
        console.log(`Incoming call from user ${from}`);
        setCallingUser(from);
        setReceivingCall(true);
      });

      socket.current.on("callAccepted", (signal) => {
        console.log(`Call accepted by user ${callingUser}`);
        setCallAccepted(true);
        peer.current = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: userVideoRef.current.srcObject,
        });
        peer.current.signal(signal);
        peer.current.on("stream", (partnerStream) => {
          partnerVideoRef.current.srcObject = partnerStream;
        });
      });

      socket.current.on("callRejected", () => {
        console.log("Call rejected by the user.");
        setReceivingCall(false);
        setCallingUser(null);
      });

      socket.current.on("callEnded", () => {
        console.log("Call ended by the user.");
        setCallAccepted(false);
        setCallingUser(null);
        setReceivingCall(false);
        if (peer.current) {
          peer.current.destroy();
          peer.current = null;
        }
      });

      return () => {
        if (peer.current) {
          peer.current.destroy();
          peer.current = null;
        }
      };
    }
  }, [userId, callingUser]);

  const handleLogin = () => {
    setUserId(uuidv4());
  };

  const callUser = () => {
    const callId = uuidv4();
    window.history.pushState(
      { callId },
      null,
      `${window.location.origin}/?callId=${callId}`
    );
    setCallId(callId);
    socket.current.emit("callRequest", { from: userId, to: callId });
  };

  const acceptCall = () => {
    setCallAccepted(true);
    peer.current = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: userVideoRef.current.srcObject,
    });
    peer.current.on("signal", (signal) => {
      socket.current.emit("acceptCall", { from: userId, signal });
    });
    peer.current.on("stream", (partnerStream) => {
      partnerVideoRef.current.srcObject = partnerStream;
    });
  };

  const rejectCall = () => {
    socket.current.emit("rejectCall", { from: userId });
    setReceivingCall(false);
    setCallingUser(null);
  };

  const hangUpCall = () => {
    setCallAccepted(false);
    setCallingUser(null);
    setReceivingCall(false);
    const urlParams = new URLSearchParams(window.location.search);
    const callIdFromURL = urlParams.get("callId");
    if (callIdFromURL) {
      window.history.pushState(
        { callId: null },
        null,
        window.location.origin + window.location.pathname
      );
    }
    userVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    partnerVideoRef.current.srcObject
      .getTracks()
      .forEach((track) => track.stop());

    if (peer.current) {
      peer.current.destroy();
      peer.current = null;
    }

    socket.current.emit("hangUpCall");
  };

  const toggleVideo = () => {
    userVideoRef.current.srcObject.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsVideoOn(track.enabled);
    });
  };

  const toggleMic = () => {
    userVideoRef.current.srcObject.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    });
  };

  return (
    <Container maxWidth='md' style={{ marginTop: "30px" }}>
      {!userId ? (
        <Authentication onLogin={handleLogin} />
      ) : (
        <Paper elevation={3} style={{ padding: "20px" }}>
          <video
            ref={userVideoRef}
            autoPlay
            muted
            style={{ width: "100%" }}
          ></video>
          <video
            ref={partnerVideoRef}
            autoPlay
            style={{ width: "100%", marginTop: "20px" }}
          ></video>
          {receivingCall && !callAccepted && (
            <div>
              <p>Incoming call from {callingUser}</p>
              <Button variant='contained' color='primary' onClick={acceptCall}>
                <Call />
                Accept
              </Button>
              <Button
                variant='contained'
                color='secondary'
                onClick={rejectCall}
              >
                Reject
              </Button>
            </div>
          )}
          {callAccepted && (
            <div>
              <p>Call with user {callingUser} accepted</p>
              <Button
                variant='contained'
                color='secondary'
                onClick={hangUpCall}
              >
                <CallEnd />
                Hang Up
              </Button>
            </div>
          )}
          {!receivingCall && !callAccepted && !callId && (
            <Button variant='contained' color='primary' onClick={callUser}>
              <Call />
              Start Call
            </Button>
          )}
          {userId && (
            <MeetLinkBox
              meetLink={window.location.href}
              onCopyLink={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            />
          )}
          <Grid
            container
            justifyContent='center'
            spacing={2}
            style={{ marginTop: "20px" }}
          >
            <Grid item>
              <IconButton color='primary' onClick={toggleVideo}>
                {isVideoOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton color='primary' onClick={toggleMic}>
                {isMicOn ? <Mic /> : <MicOff />}
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default App;
