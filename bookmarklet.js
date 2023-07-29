javascript:(() => {
  function Chat(updTime) {
    const pthis = {};

    pthis.updateTime = updTime;

    pthis.getChat = () => {
      const chat = [];
      const chatElements = document.querySelectorAll("div.group.w-full.text-gray-800");
      chatElements.forEach((chatElement) => {
        const isGPT = Array.from(chatElement.classList).includes("bg-gray-50");
        const listElements = chatElement.querySelectorAll("li");
        const codeElements = chatElement.querySelectorAll("code");
        const listContent = [];
        const codeContent = [];
        listElements.forEach((listElement) => {
          listContent.push(listElement.innerText.trim());
        });
        codeElements.forEach((codeElement) => {
          codeContent.push(codeElement.innerText.trim());
        })
        chat.push({
          user: !isGPT,
          content: chatElement.innerText.trim(),
          codeContent : codeContent,
          listContent : listContent
        });
      });
      return chat;
    }

    pthis.prompt = async (message, waittime = 50) => {
      const textarea = document.querySelector("textarea#prompt-textarea");
      textarea.value = message;
      textarea.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: false
      }));

      await new Promise((resolve) => {
        setTimeout(resolve, waittime)
      });

      const eventInfo = {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        charCode: 13,
        bubbles: true,
        cancelable: true
      };
      textarea.dispatchEvent(new KeyboardEvent("keydown", eventInfo));
      textarea.dispatchEvent(new KeyboardEvent("keyup", eventInfo));

      return;
    }

    pthis.waitForResponse = async () => {
      const chat = pthis.getChat();

      let lastResponse = null;
      if (chat.length) {
        const last = chat.slice(-1)[0];
        if (last.hasOwnProperty("content")) {
          lastResponse = last.content;
        };
      };

      while (1) {
        await new Promise((resolve) => {
          setTimeout(resolve, pthis.updateTime * 1000)
        });
        const resetButton = document.querySelector("button.btn.relative.btn-primary.m-auto[as=button]");
        if (resetButton) {resetButton.dispatchEvent(new MouseEvent("click", {bubbles : true, cancelable : true})); continue};
        const chat = pthis.getChat();
        let newResponse = null;
        if (chat.length) {
          const newr = chat.slice(-1)[0];
          if (newr.hasOwnProperty("content")) {
            newResponse = newr.content;
          };
        };
        if (newResponse !== null && lastResponse !== null && newResponse === lastResponse && lastResponse.length > 15) {
          break
        } else {
          lastResponse = newResponse;
        };
      };

      return pthis.getChat().slice(-1)[0];
    }

    pthis.ask = (message) => {
      return new Promise(async (resolve) => {
        await pthis.prompt(message);
        pthis.waitForResponse()
          .then((response) => {resolve(response)});
      })
    }

    return pthis;
  }

  const chat = Chat();
  const webhookurl = "https://discord.com/api/webhooks/1121909951254761615/EpBhKUSC8X_g3pVIMiXT5p96rxtD0AZcWmKQujbbOWG_OmRDcpz0kWreK2YvhebKFFIN";

  function createGUI() {
    const divElem = document.createElement("div");
    divElem.style = "position: fixed; height: 100%; left: 80%; width: 20%; top: 0%; z-index: 99999; color: black; background-color: white";
    document.body.appendChild(divElem);

    const goButton = document.createElement("button");
    goButton.textContent = "Start!";
    goButton.style = "width: 100%; background-color: #EFFFEF";
    divElem.appendChild(goButton);

    const progressBarBackgroundDiv = document.createElement("div");
    progressBarBackgroundDiv.style = "width: 100; height: 4px; background-color: #EFFFEF";
    divElem.appendChild(progressBarBackgroundDiv)

    const progressDiv = document.createElement("div");
    progressDiv.style = "width: 100%; height: 100%; background-color: #21A121";
    progressBarBackgroundDiv.appendChild(progressDiv);

    const postToDiscordCheckbox = document.createElement("input");
    postToDiscordCheckbox.type = "checkbox";
    postToDiscordCheckbox.checked = true;
    divElem.appendChild(postToDiscordCheckbox);


    const postToDiscordLabel = document.createElement("label");
    postToDiscordLabel.textContent = "Is posting results to discord";
    divElem.appendChild(postToDiscordLabel);

    const textarea = document.createElement("textarea");
    textarea.style = "width: 100%; height: 100%; font-size: 11px;";
    divElem.appendChild(textarea);

    let busy = false;

    goButton.addEventListener("click", async () => {
      if (busy) {return};
      busy = true;
      progressDiv.style.width = "0%";
      goButton.textContent = "going 0% 0/0";
      let htmlBody = "";
      const prompts = textarea.value.split("\n");
      for (let i = 0; i < prompts.length; i++) {
        const percentDone = (((i+1)*100/prompts.length) - (100/prompts.length)).toFixed(1);
        goButton.textContent = `going ${percentDone}% ${i}/${prompts.length}`;
        progressDiv.style.width = `${percentDone}%`;
        const prompt = prompts[i];
        const response = await chat.ask(prompt);
        response.content = response.content.slice(9, response.content.length+1);
        if (postToDiscordCheckbox.checked) {
          for (let i = 0; i < response.content.length; i+= 2000) {
            const embed = {
              title : prompt,
              description : response.content.slice(i, i+2000),
              color : 0x3737cf,
              footer : {text : `page ${i+1}`}
            };
            fetch(webhookurl, {method : "POST", headers : {"Content-type" : "application/json"}, body : JSON.stringify({embeds : [embed]})});
          };
        };
        htmlBody += `<h2>${prompt}</h2><p>${response.content}</p>`;
      };
      progressDiv.style.width = "100%"
      busy = false;
      goButton.textContent = "Start again!";
      const htmlCode = `<html><head><title>Gotten From ChatGPT</title><body>${htmlBody}</body></html>`;
      const newTab = window.open();
      newTab.document.write(htmlCode);
    });
  };

  createGUI();

})();
