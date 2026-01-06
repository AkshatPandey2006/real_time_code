import { useEffect, useState, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("https://real-time-code-9ui2.onrender.com/");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [outPut, setOutPut] = useState("");
  const [version, setVersion] = useState("*");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true); // New state for terminal toggle

  const editorRef = useRef(null);

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

    socket.on("codeResponse", (response) => {
      setOutPut(response.run.output);
      setIsTerminalOpen(true); // Auto-open terminal on result
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
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
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
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

  const runCode = () => {
    socket.emit("compileCode", { code, roomId, language, version });
  };

  const toggleTerminal = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Collab Code</h1>
          <div className="input-group">
            <input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
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
          <h2>Code Room</h2>
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
                {user.slice(0, 8)}...
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
        {/* Toolbar */}
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
                <button className="run-btn" onClick={runCode}>
                    ▶ Run
                </button>
                <button className={`terminal-toggle ${isTerminalOpen ? 'active' : ''}`} onClick={toggleTerminal}>
                    {isTerminalOpen ? "Hide Terminal" : "Show Terminal"}
                </button>
            </div>
        </div>

        {/* Code Editor */}
        <div className={`editor-wrapper ${isTerminalOpen ? "shrink" : "full"}`}>
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

        {/* Terminal / Output Section */}
        {isTerminalOpen && (
          <div className="terminal-container">
            <div className="terminal-header">
              <span>Output / Console</span>
              <button className="clear-btn" onClick={() => setOutPut("")}>
                Clear
              </button>
            </div>
            <div className="terminal-body">
              {outPut ? <pre>{outPut}</pre> : <p className="placeholder">Click "Run" to see output here...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
