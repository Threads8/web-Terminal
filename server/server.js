import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "node-pty";
import http from "http";

// Setup Express app
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: "/terminal" });

// For each WebSocket connection
wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    let baseDirectory = '~/Desktop/Files/'
    var currentCommand = ""
    // Spawn shell (bash or powershell depending on OS)
    const shell = "bash";
    const ptyProcess = spawn(shell, [], {
        name: "xterm-color",
        env: process.env,
        cwd: "/home/dtp202505-u09/Desktop/Files"
    });

    // Send shell output to client
    // ptyProcess.onData((data) => {
    //     const resp = parseTerminalOutput(data, firstResponse, baseDirectory);
    //     if(resp){
    //         const {cwd} = resp 
    //         console.log("baseDirectory ", baseDirectory);
    //         baseDirectory = cwd;
    //         console.log("baseDirectory ", baseDirectory);
    //         console.log("cwd ", cwd);
    //         if(firstResponse){
    //             console.log("INSIDE");
    //             firstResponse = false;
    //             const cleanedCWD = cwd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape for RegExp
    //             const cwdRegex = new RegExp(cleanedCWD, 'g');
    //             data = data.replace(cwdRegex, baseDirectory);
    //         }
    //         console.log("Data ", data);
    //     } 
    //     const message = JSON.stringify({
    //         type:"response",
    //         data
    //     })
    //     ws.send(message);
    // });

    ptyProcess.onData((data) => {
        // const resp = parseTerminalOutput(data, firstResponse, baseDirectory);
      
        // if (resp) {
        //   const { cwd } = resp;
        //   baseDirectory = cwd; 
      
        // //   if (firstResponse) {
        // //     firstResponse = false;
      
        // //     // Strip ANSI codes from data to find plain text index of cwd
        // //     const plainText = stripAnsi(data);
        // //     console.log("plainText ", plainText);

        // //     // Find start index of cwd in plain text
        // //     const idx = plainText.indexOf(cwd);
        // //     if (idx !== -1) {
        // //       // Now replace cwd with baseDirectory inside data, preserving ANSI codes
        // //       // We'll build the new data by replacing substring in the raw data
      
        // //       // Split data into three parts: before cwd, cwd part, after cwd in the raw data with ANSI
        // //       // This is tricky since ANSI escapes mess up indexing, so better to do a regex replace
      
        // //       // Escape baseDirectory for regex
        // //       const escapedCwd = cwd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
        // //       // Regex to match cwd path possibly wrapped in ANSI codes (non-greedy)
        // //       const cwdWithAnsiRegex = new RegExp(`(\\u001b\\[[0-9;?]*[a-zA-Z])?${escapedCwd}(\\u001b\\[[0-9;?]*[a-zA-Z])?`, 'g');
      
        // //       // Replace cwd (with optional surrounding ANSI) with baseDirectory
        // //       data = data.replace(cwdWithAnsiRegex, (match) => {
        // //         // You can preserve color codes if needed, here simply return baseDirectory without color
        // //         return baseDirectory;
        // //       });
        // //     }
        // //   }
        // }
        // console.log(data);
          const message = JSON.stringify({
            type: "response",
            data,
          });
          ws.send(message);
      });

    // Send client input to shell
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        var newCommand = data.command;
        currentCommand = newCommand;
        console.log("New Command ", newCommand);
        ptyProcess.write(`${data.command} \n`)

        // if(data.type === "command"){
        //     const arr = data.command.split(" ");
        //     const len = arr.length;
        //     var newCommand = "";
        //     let size = len-1 > 1 ? len-1 : 1;
        //     for(let i = 0; i<size; i++){
        //         newCommand += arr[i];
        //         newCommand += ' ';
        //     }
        //     newCommand += baseDirectory
        //     if(len > 1) newCommand += arr[len-1];
        //     newCommand += " ";
        //     newCommand += '\n'
        //     console.log("NEW COMMAND ", newCommand);
        //     ptyProcess.write(newCommand)
        // }
    });

    // Cleanup on disconnect
    ws.on("close", () => {
        ptyProcess.kill();
        console.log("WebSocket connection closed");
    });
});

// Serve on port 3000
server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

function parseTerminalOutput(raw, firstResponse,baseDirectory) {
    // console.log("raw ", raw);
    let str = raw;
    if (firstResponse) {
        // Extract username@hostname from the window title OSC sequence
        const oscMatch = raw.match(/\u001b\]0;([^:]+@[^:]+):/);
        if (oscMatch) {
          str = `${oscMatch[1]}:${baseDirectory}`;
        } else {
          // Fallback if OSC sequence not found
          const fallback = raw.split(':')[0];
          str = `${fallback}:${baseDirectory}`;
        }
    }
    // console.log("str ", str);
    // Remove ANSI escape codes
    const cleaned = str.replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '')
                       .replace(/\u001b\][^\u0007]*\u0007/g, '');
  
    // Match the prompt pattern: user@host: ~/path$
    // console.log("Cleaned ",cleaned);
    const promptRegex = /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+):(~[^\$]*)/;
    const match = cleaned.match(promptRegex);
    console.log("Match ", match);
    if (!match) return null;
  
    return {
      username: match[1],
      hostname: match[2],
      cwd: match[3].trim(),
    };
  }

  
 
  

  