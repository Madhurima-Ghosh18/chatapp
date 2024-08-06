import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Notification = () => {
  return (
    <div className="">
        <ToastContainer position="bottom-right"/> {/*error or success messages at bottom-right*/}
      
    </div>
  )
}

export default Notification
