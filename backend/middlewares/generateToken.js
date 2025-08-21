const generateToken = (user) => {
	return jwt.sign(
		{
			id_user: user.id_user,
			name: user.name || "", // User's name (empty if not defined)
			email: user.email,
		},
		process.env.JWT_SECRET, // Secret key from environment variables
		{
			expiresIn: "1h", // Token expiration time
		},
	);
};
