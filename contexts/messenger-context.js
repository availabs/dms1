import React from "react"

const MessengerContext = React.createContext({});

export const useMessenger = () => React.useContext(MessengerContext);

export default MessengerContext;
