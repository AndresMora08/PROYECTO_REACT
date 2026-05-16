// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../models/User";
import { LocalStorageProvider } from "../storage/LocalStorageProvider";

const storage = new LocalStorageProvider();
const storedUser = storage.getItem("user");

interface UserState {
    user: User | null;
}

const initialState: UserState = {
    user: storedUser ? JSON.parse(storedUser) : null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            // Sincronizamos con localStorage automáticamente
            if (action.payload) {
                storage.setItem("user", JSON.stringify(action.payload));
            } else {
                storage.removeItem("user");
            }
        },
        clearUser: (state) => {
            state.user = null;
            storage.removeItem("user");
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;