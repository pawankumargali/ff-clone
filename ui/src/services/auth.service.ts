export const isAuthenticated = () => {
    const token = localStorage.getItem('userToken') ?? null
    if(token) return true;
    return false;
}

export const logoutUser = () =>  {
  localStorage.removeItem('userToken');
}
