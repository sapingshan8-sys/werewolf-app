export function getPlayerSession() {
  if (typeof window === "undefined") {
    return {
      playerId: "",
      roomCode: "",
    };
  }

  return {
    playerId:
      sessionStorage.getItem("playerId") ||
      localStorage.getItem("playerId") ||
      "",
    roomCode:
      sessionStorage.getItem("roomCode") ||
      localStorage.getItem("roomCode") ||
      "",
  };
}

export function setPlayerSession(
  roomCode: string,
  playerId: string
) {
  sessionStorage.setItem("roomCode", roomCode);
  sessionStorage.setItem("playerId", playerId);

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("playerId", playerId);
}
