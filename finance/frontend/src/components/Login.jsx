import { useState } from "react";
import { login } from "../api/api";

function Login({ onLogin }) {

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await login(
                    username,
                    password
                );


            if (
                !response?.success ||
                !response?.token
            ) {

                throw new Error(
                    "توکن ورود دریافت نشد."
                );

            }


            localStorage.setItem(
                "token",
                response.token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.user || {}
                )
            );


            onLogin(response.user);

        } catch (err) {

            console.error(
                "Login Error:",
                err
            );

            setError(
                err.message ||
                "ورود ناموفق بود."
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div
            dir="rtl"
            style={{
                maxWidth: "400px",
                margin: "80px auto",
                padding: "30px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                fontFamily: "Tahoma",
            }}
        >

            <h1>
                امور مالی شهرک
            </h1>

            <h2>
                ورود
            </h2>


            <form
                onSubmit={handleSubmit}
            >

                <div
                    style={{
                        marginBottom: "15px",
                    }}
                >

                    <label>
                        نام کاربری
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(
                                event.target.value
                            )
                        }
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            boxSizing: "border-box",
                        }}
                    />

                </div>


                <div
                    style={{
                        marginBottom: "15px",
                    }}
                >

                    <label>
                        رمز عبور
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            boxSizing: "border-box",
                        }}
                    />

                </div>


                {error && (
                    <p
                        style={{
                            color: "red",
                        }}
                    >
                        {error}
                    </p>
                )}


                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        cursor: loading
                            ? "wait"
                            : "pointer",
                    }}
                >

                    {loading
                        ? "در حال ورود..."
                        : "ورود"}

                </button>

            </form>

        </div>
    );
}

export default Login;