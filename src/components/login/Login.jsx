import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light-theme');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    document.body.className = theme === "light" ? "light-theme" : "dark-theme";
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const validateForm = (data, isRegistration = false) => {
    const errors = {};
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Valid email is required";
    }
    if (!data.password || data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (isRegistration) {
      if (!data.username) {
        errors.username = "Username is required";
      }
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const formErrors = validateForm(data, true);
  
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setLoading(false);
      return;
    }
  
    try {
      const res = await createUserWithEmailAndPassword(auth, data.email, data.password);
      let imgUrl = null;
  
      if (avatar.file) {
        try {
          imgUrl = await upload(avatar.file);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.warning("Failed to upload image. Profile created without an avatar.");
        }
      }
  
      await setDoc(doc(db, "users", res.user.uid), {
        username: data.username,
        email: data.email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });
      await setDoc(doc(db, "userchats", res.user.uid), { chats: [] });
      toast.success("Account created successfully!");
      
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const formErrors = validateForm(data);
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Success!");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <button className="theme-toggle" onClick={toggleTheme}>
          <img src={theme === "light" ? "./moon.png" : "./sun.png"} alt="Toggle Theme" />
      </button>
      <div className="item">
        <h2>Welcome back!</h2>
        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email</label>
          <input type="email" id="login-email" placeholder="Email" name="email" aria-invalid={errors.email ? "true" : "false"} />
          {errors.email && <span className="error">{errors.email}</span>}
          
          <label htmlFor="login-password">Password</label>
          <input type="password" id="login-password" placeholder="Password" name="password" aria-invalid={errors.password ? "true" : "false"} />
          {errors.password && <span className="error">{errors.password}</span>}
          
          <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
        </form>
        <a href="#" className="forgot-password">Forgot Password?</a>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="Avatar preview" />
            Upload an Image
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} accept="image/*" />
          
          <label htmlFor="register-username">Username</label>
          <input type="text" id="register-username" placeholder="Username" name="username" aria-invalid={errors.username ? "true" : "false"} />
          {errors.username && <span className="error">{errors.username}</span>}
          
          <label htmlFor="register-email">Email</label>
          <input type="email" id="register-email" placeholder="Email" name="email" aria-invalid={errors.email ? "true" : "false"} />
          {errors.email && <span className="error">{errors.email}</span>}
          
          <label htmlFor="register-password">Password</label>
          <input type="password" id="register-password" placeholder="Password" name="password" aria-invalid={errors.password ? "true" : "false"} />
          {errors.password && <span className="error">{errors.password}</span>}
          
          <label htmlFor="register-confirm-password">Confirm Password</label>
          <input type="password" id="register-confirm-password" placeholder="Confirm Password" name="confirmPassword" aria-invalid={errors.confirmPassword ? "true" : "false"} />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          
          <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;