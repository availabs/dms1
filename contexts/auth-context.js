import React from "react"

const DmsContext = React.createContext({
  authRules: null, user: null,
  useRouter: false, basePath: null
});

export const useAuth = () => React.useContext(DmsContext);

export default DmsContext;
