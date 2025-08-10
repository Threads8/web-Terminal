import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

const TerminalComponent = () => {
  const terminalRef = useRef(null);  //store reference of div
  const term = useRef(null); // store referenec of terminal object
  const socket = useRef(null); // store reference of socket connetion
  const commandBuffer = useRef(""); // store current command
  const commandHistory = useRef([]); // store all the previous command
  const historyIndex = useRef(-1); // iterator for commandHistory


  function clearLine() {
    while (commandBuffer.current.length > 0) {
      term.current.write("\b \b");
      commandBuffer.current = commandBuffer.current.slice(0, -1);
    }
  }

  const setUpTerminal = ()=>{

    const fontSize = 14;
    const screenWidth = window.innerWidth; 
    const charWidth = fontSize * 0.6; // approximation -> calculated for char of fontFamily monospace
    const cols = Math.floor(screenWidth / charWidth)-5;
    // Initialize terminal
    term.current = new Terminal({
      cursorBlink: true,
      cursorWidth: 1,
      cursorStyle:"bar",
      fontFamily: "monospace",
      rows: 100,
      cols,
      fontSize,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
        cursor: "#ffffff",
        selection: "#4d4d4d"
      },
    });
    

    // Open terminal in div
    term.current.open(terminalRef.current);
    term.current.write("Connected to server...\r\n$ ");

    // Connect to WebSocket server
    socket.current = new WebSocket("ws://localhost:3000/terminal");

    
    term.current.onData((data) => {
      const code = data.charCodeAt(0);

      
      if (data === '\x1b[A') {
        if (commandHistory.current.length > 0 && historyIndex.current > 0) {
          historyIndex.current--;
        } else if (historyIndex.current === -1 && commandHistory.current.length > 0) {
          historyIndex.current = commandHistory.current.length - 1;
        }
    
        if (commandHistory.current[historyIndex.current]) {
          // Clear current line
          while (commandBuffer.current.length > 0) {
            term.current.write('\b \b');
            commandBuffer.current = commandBuffer.current.slice(0, -1);
          }
          // Show previous command
          const prevCommand = commandHistory.current[historyIndex.current];
          term.current.write(prevCommand);
          commandBuffer.current = prevCommand;
        }
        return;
      }


      if (data === '\x1b[B') {
        if (commandHistory.current.length > 0 && historyIndex.current !== -1) {
          historyIndex.current++;
          if (historyIndex.current >= commandHistory.current.length) {
            historyIndex.current = -1;
            clearLine(); // Clear input
            commandBuffer.current = "";
          } else {
            const nextCommand = commandHistory.current[historyIndex.current];
            clearLine();
            term.current.write(nextCommand);
            commandBuffer.current = nextCommand;
          }
        }
        return;
      }
      

      switch (code) {
        case 3: // Ctrl+C
          socket.current.send(JSON.stringify({
            type: "command",
            command: '\x03'
          }));
          term.current.write("\r\n$ ");
          commandBuffer.current = "";
          historyIndex.current = -1;
          break;
    
        case 13: // Enter key
          const command = commandBuffer.current;
          socket.current.send(JSON.stringify({
            type: "command",
            command
          }));
          term.current.write("\r\n");
          if (command.trim()) {
            commandHistory.current.push(command);
          }
          commandBuffer.current = "";
          historyIndex.current = -1;
          break;
    
        case 127: // Backspace
          if (commandBuffer.current.length > 0) {
            commandBuffer.current = commandBuffer.current.slice(0, -1);
            term.current.write("\b \b");
          }
          break;
    
        default:
          commandBuffer.current += data;
          term.current.write(data);
      }

    });
    

    // Handle WebSocket messages
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      term.current.write(data.data);
    };
  }

  useEffect(() => {
    if (terminalRef.current){
      setUpTerminal();
    }

    return () => {
      term.current?.dispose();
      socket.current?.close();
    };
  }, []);

  return <div ref={terminalRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default TerminalComponent;
