import ChatList from "./chatList/ChatList"
import "../../theme.css";
import "./list.css"
import UserInfo from "./userInfo/UserInfo"
import { useTheme } from "../../ThemeContext"

const List = () => {
  const { theme } = useTheme();
  return (
    <div className={`List ${theme}`}>
      <div className="list">
        <UserInfo/>
        <ChatList/>
      </div>
    </div>
  )
}

export default List