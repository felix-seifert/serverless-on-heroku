/**
 * Creates input elements that are used to specify environment variables. A remove button is also generated.
 */
const addEnvironmentVariables = () => {
    const environmentVariablesContainer = document.getElementById("environmentVariables");

    const containerNode = document.createElement("div");
    containerNode.setAttribute("class", "environmentVariable");

    const keyNode = document.createElement("input");
    keyNode.setAttribute("type", "text");
    keyNode.setAttribute("class", "environmentVariableKey");
    keyNode.setAttribute("required", true);
    keyNode.setAttribute("placeholder", "Key");

    const valueNode = document.createElement("input");
    valueNode.setAttribute("type", "text");
    valueNode.setAttribute("class", "environmentVariableValue");
    valueNode.setAttribute("required", true);
    valueNode.setAttribute("placeholder", "Value");

    const removeButton = document.createElement("button");
    removeButton.innerText = "Remove";
    removeButton.onclick = () => {
        environmentVariablesContainer.removeChild(containerNode);
    };

    containerNode.appendChild(keyNode);
    containerNode.appendChild(valueNode);
    containerNode.appendChild(removeButton);

    environmentVariablesContainer.appendChild(containerNode);
};
