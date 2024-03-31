import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";

import io from "socket.io-client";
// import Peer from "simple-peer";

const socket = io("http://localhost:5000"); // Connect to your server URL

const LandingPage = () => {
  const [roomID, setRoomID] = useState(null);
  const [stream, setStream] = useState(null);
  const userVideoRef = useRef();
  const partnerVideoRef = useRef();
  const [initiator, setInitiator] = useState(false);

  useEffect(() => {
    socket.on("roomID", (id) => {
      setRoomID(id);
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        userVideoRef.current.srcObject = stream;
      });

    socket.on("message", (message) => {
      if (message.type === "offer") {
        handleOffer(message.offer);
      } else if (message.type === "answer") {
        handleAnswer(message.answer);
      } else if (message.type === "ice-candidate") {
        handleNewICECandidate(message.candidate);
      }
    });
  }, []);

  const handleJoin = () => {
    socket.emit("join");
    setInitiator(true);
  };

  const handleOffer = (offer) => {
    const peer = new Peer({ initiator: false, stream });
    peer.signal(offer);

    peer.on("stream", (stream) => {
      partnerVideoRef.current.srcObject = stream;
    });

    peer.on("signal", (data) => {
      socket.emit("message", { type: "answer", answer: data });
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });
  };

  const handleAnswer = (answer) => {
    peer.signal(answer);
  };

  const handleNewICECandidate = (candidate) => {
    peer.addIceCandidate(candidate).catch((err) => {
      console.error("Error adding ICE candidate:", err);
    });
  };

  let peer;
  if (initiator) {
    peer = new Peer({ initiator: true, stream });
    peer.on("signal", (data) => {
      socket.emit("message", { type: "offer", offer: data });
    });
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl mb-4">Welcome to Video Call App</h1>
        <button
          onClick={handleJoin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Join
        </button>
        {roomID && <p className="mt-4">Room ID: {roomID}</p>}
        <div className="flex justify-center mt-4">
          <video
            ref={userVideoRef}
            autoPlay
            muted
            style={{ width: "50%" }}
          ></video>
          <video
            ref={partnerVideoRef}
            autoPlay
            style={{ width: "50%" }}
          ></video>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;