import axios from 'axios';

export const setAuthToken = token => {
    if(token) {
        axios.defaults.headers.common['Authorization'] = token;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

// sign in
export const login = user => {(
    axios.post('/api/users/login', user)
)};

// sign up
export const signup = user => {(
    axios.post('/api/users/register', user)
)};