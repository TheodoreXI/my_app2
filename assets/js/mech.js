const API_URL = "/api"; // this gonna change to your backend api 

export async function signup(email, password, userData)
{
	const res = await fetch(`${API_URL}/signup`, { 
		method : "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({email, password, userData})
	});
	
	if (!res.ok)
		throw Error("Signup failed");
	return res.text();
}

export async function login(email, password)
{
	const res = await fetch(`${API_URL}/login`, { 
		method : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
        });

        if (!res.ok)
                throw Error("login failed");
        return res.text();
}
