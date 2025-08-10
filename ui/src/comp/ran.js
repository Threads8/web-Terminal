import { useEffect, useRef } from "react"
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
const RAN = ()=>{
    const terRef = useRef(null);
    const terminalInstance = useRef(null);
    const socket = useRef(null);
    const commandBuffer = useRef("");
    const commandHistory = useRef([]);
    const historyIndex = useRef(-1);

    
    function clearLine() {
        while (commandBuffer.current.length > 0) {
          terminalInstance.current.write("\b \b");
          commandBuffer.current = commandBuffer.current.slice(0, -1);
        }
    }

    const ArrowUp = (data)=>{
        
        if (data === '\x1b[A') {
            // Up arrow
            if (commandHistory.current.length > 0 && historyIndex.current > 0) {
              historyIndex.current--;
            } else if (historyIndex.current === -1 && commandHistory.current.length > 0) {
              historyIndex.current = commandHistory.current.length - 1;
            }
        
            if (commandHistory.current[historyIndex.current]) {
              // Clear current line
              while (commandBuffer.current.length > 0) {
                terminalInstance.current.write('\b \b');
                commandBuffer.current = commandBuffer.current.slice(0, -1);
              }
              // Show previous command
              const prevCommand = commandHistory.current[historyIndex.current];
              terminalInstance.current.write(prevCommand);
              commandBuffer.current = prevCommand;
            }
            return;
          }

    }

    const ArrowDown = (data)=>{
        if (data === '\x1b[B') {
            // DOWN ARROW
            if (commandHistory.current.length > 0 && historyIndex.current !== -1) {
              historyIndex.current++;
              if (historyIndex.current >= commandHistory.current.length) {
                historyIndex.current = -1;
                clearLine(); // Clear input
                commandBuffer.current = "";
              } else {
                const nextCommand = commandHistory.current[historyIndex.current];
                clearLine();
                terminalInstance.current.write(nextCommand);
                commandBuffer.current = nextCommand;
              }
            }
            return;
          }
    }
    
    const setUpTerminal = ()=>{

        terminalInstance.current = new Terminal({
                cursorBlink: true,
                cursorWidth: 1,
                cursorStyle:"bar",
                fontFamily: "monospace",
                rows: 100,
                cols: 100,
                fontSize: 14,
                theme: {
                background: "black",
                foreground: "#ffffff",
                cursor: "#ffffff",
                selection: "#4d4d4d"
            },
        });

        terminalInstance.current.open(terRef.current);
        terminalInstance.current.write("Connected to server...\r\n$ ");

        // socket Connection
        socket.current = new WebSocket("ws://localhost:3000/terminal");
        

        terminalInstance.current.onData((data) => {
            const code = data.charCodeAt(0);
      
            // Handle arrow keys and special sequences
            ArrowUp(data);
            ArrowDown(data);
            
            switch (code) {

              case 3: // Ctrl+C
                socket.current.send(JSON.stringify({
                  type: "command",
                  command: '\x03'
                }));
                terminalInstance.current.write("\r\n$ ");
                commandBuffer.current = "";
                historyIndex.current = -1;
                break;
          
              case 13: // Enter key
                const command = commandBuffer.current;
                socket.current.send(JSON.stringify({
                  type: "command",
                  command
                }));
                terminalInstance.current.write("\r\n");
                if (command.trim()) {
                  commandHistory.current.push(command);
                }
                commandBuffer.current = "";
                historyIndex.current = -1;
                break;
          
              case 127: // Backspace
                if (commandBuffer.current.length > 0) {
                  commandBuffer.current = commandBuffer.current.slice(0, -1);
                  terminalInstance.current.write("\b \b");
                }
                break;
          
              default:
                commandBuffer.current += data;
                terminalInstance.current.write(data);
            }

        });

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Data ", data);
            // terminalInstance.current.write("hey");
            terminalInstance.current.write(data.data);
        };
    }


    useEffect(()=>{
        setUpTerminal();
    })
    return (
      <div ref={terRef}  style={{ width: "100vw", height: "100vh" }} ></div>
    )
}

export default RAN