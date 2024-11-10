import ChatList from "./chatList/ChatList";
import "../../theme.css";
import "./list.css";
import UserInfo from "./userInfo/UserInfo";
import { useTheme } from "../../ThemeContext";
import { useEffect } from "react";
import { useChatStore } from "../../lib/chatStore";

const List = () => {
  const { theme } = useTheme();
  const clearSelectedChat = useChatStore(state => state.clearSelectedChat);

  useEffect(() => {
    // Ensure no chat is selected when the List component mounts
    clearSelectedChat();
  }, [clearSelectedChat]);

  return (
    <div className={`List ${theme}`}>
      <div className="list">
        <UserInfo />
        <ChatList />
      </div>
    </div>
  );
};

export default List;