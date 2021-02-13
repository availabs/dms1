import React from "react"

const MessengerContext = React.createContext({
  pageMessages: [], attributeMessages: []
});

export const useMessenger = () => React.useContext(MessengerContext);

export default MessengerContext;
