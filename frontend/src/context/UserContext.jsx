// UserContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {



    const [user, setUser] = useState({
        userid: null,
        is_setup: false,
        step_skills: false,
        step_goals: false,
        step_prefs: false,
    });

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);