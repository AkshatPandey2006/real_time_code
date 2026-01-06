import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("https://real-time-code-9ui2.onrender.com/");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [agenda, setAgenda] = useState(""); // New State for Agenda
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      // Pass agenda to server if backend supports it, otherwise it stays local for now
      socket.emit("join", { roomId, userName, agenda });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setAgenda(""); // Reset Agenda
    setCode("// start code here");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  // Generate a random unique ID
  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 10);
    setRoomId(id);
  };

  // Handle Enter key in join form
  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Collab Code</h1>
          
          <div className="input-group">
            <div className="room-id-wrapper">
              <input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyUp={handleInputEnter}
              />
              <button className="btn-generate" onClick={generateRoomId}>
                Generate
              </button>
            </div>

            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyUp={handleInputEnter}
            />

            <input
              type="text"
              placeholder="Agenda (e.g., LeetCode 101)"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              onKeyUp={handleInputEnter}
            />
          </div>

          <button onClick={joinRoom} className="btn-join">
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          {/* Display Agenda instead of "Code Room" */}
          <h2 title={agenda}>{agenda || "Code Room"}</h2>
          <div className="room-id-box">
            <span>ID: {roomId}</span>
            <button onClick={copyRoomId} className="copy-btn">
              {copySuccess ? "✓" : "📋"}
            </button>
          </div>
        </div>

        <div className="users-list">
          <h3>Active Users</h3>
          <ul>
            {users.map((user, index) => (
              <li key={index} className="user-item">
                <span className="avatar">{user.charAt(0).toUpperCase()}</span>
                <span className="username">{user}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="leave-btn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        <div className="toolbar">
          <div className="left-tools">
            <select
              className="lang-select"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="right-tools">
            <span className="typing-indicator">{typing}</span>
          </div>
        </div>

        <div className="editor-wrapper">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
