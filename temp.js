function parseTerminalOutput(raw) {
    // Remove ANSI escape codes
    const cleaned = raw.replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '')
                       .replace(/\u001b\][^\u0007]*\u0007/g, '');
  
    // Match the prompt pattern: user@host: ~/path$
    console.log("Cleaned ", cleaned);
    const promptRegex = /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+):(~[^\$]*)/;
    const match = cleaned.match(promptRegex);
    console.log("match ", match);
    if (!match) return null;
  
    return {
      username: match[1],
      hostname: match[2],
      cwd: match[3].trim(),
    };
  }
  
  
//   // Example usage
  const response = {
    type: "response",
    data: "\u001b[?2004h\u001b]0;dtp202505-u09@dtp202505u09-Latitude-5490: ~/Desktop/Terminal/server\u0007\u001b[01;32mdtp202505-u09@dtp202505u09-Latitude-5490\u001b[00m:\u001b[01;34m~/Desktop/Terminal/server\u001b[00m$ "
  };
  
  console.log(parseTerminalOutput(response.data));