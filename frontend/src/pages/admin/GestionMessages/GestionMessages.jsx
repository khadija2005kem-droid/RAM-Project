import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./GestionMessages.css";
import { api } from "../../../services/api";

function GestionMessages() {
  const [messages, setMessages] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});

  const fetchMessages = useCallback(async () => {
    try {
      const result = await api.adminMessagesAll();

      const mappedMessages = (result?.data || []).map((msg) => ({
        id: msg.id,
        nom: msg.nom || "",
        prenom: msg.prenom || "",
        email: msg.email || "",
        sujet: msg.sujet || "",
        message: msg.message || "",
        status: msg.status || "non_repondu",
        date: msg.created_at ? new Date(msg.created_at).toLocaleDateString("fr-FR") : "",
      }));

      setMessages(mappedMessages);
      setSelectedMessageId((currentSelectedId) => {
        if (currentSelectedId && mappedMessages.some((msg) => msg.id === currentSelectedId)) {
          return currentSelectedId;
        }

        return mappedMessages[0]?.id || null;
      });
    } catch (error) {
      console.log("Admin messages fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const fullName = `${msg.nom} ${msg.prenom}`.toLowerCase();
      const sujet = msg.sujet.toLowerCase();
      const email = msg.email.toLowerCase();
      const value = searchTerm.toLowerCase();

      return fullName.includes(value) || sujet.includes(value) || email.includes(value);
    });
  }, [messages, searchTerm]);

  const selectedMessage = useMemo(() => {
    return messages.find((msg) => msg.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  const handleSelectMessage = (id) => {
    setSelectedMessageId(id);
    setSuccessMessage("");
    setReplyError("");
  };

  const handleReplyChange = (e) => {
    const value = e.target.value;
    setReplyError("");
    setSuccessMessage("");

    setReplyDrafts((prevDrafts) => ({
      ...prevDrafts,
      [selectedMessageId]: value,
    }));
  };

  const handleSendReply = async () => {
    const replyValue = (replyDrafts[selectedMessageId] || "").trim();

    if (!selectedMessage || replyValue === "") {
      setReplyError("Veuillez ecrire une reponse avant l'envoi.");
      setSuccessMessage("");
      return;
    }

    setReplyError("");
    setSuccessMessage("");
    setSendingReply(true);

    try {
      const result = await api.adminReplyToMessage(selectedMessage.id, replyValue);

      setSuccessMessage(result?.message || "Message sent successfully via email");

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === selectedMessage.id ? { ...msg, status: "repondu" } : msg
        )
      );

      setReplyDrafts((prevDrafts) => ({
        ...prevDrafts,
        [selectedMessageId]: "",
      }));
    } catch (error) {
      console.log("Admin reply error:", error);
      setReplyError(error?.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusLabel = (status) => {
    return status === "repondu" ? "Repondu" : "Non repondu";
  };

  const getStatusClassName = (status) => {
    return status === "repondu" ? "mini-status replied" : "mini-status pending";
  };

  return (
    <div className="gestion-messages-page">
      <div className="gestion-messages-card">
        <h1 className="gestion-messages-title">Gestion des Messages</h1>

        <div className="messages-layout">
          <div className="messages-list">
            <h2 className="section-title">Boite de reception</h2>

            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher par nom, sujet ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${selectedMessageId === msg.id ? "active" : ""}`}
                  onClick={() => handleSelectMessage(msg.id)}
                >
                  <div className="message-item-top">
                    <span className="message-name">
                      {msg.nom} {msg.prenom}
                    </span>

                    <span className={getStatusClassName(msg.status)}>
                      {getStatusLabel(msg.status)}
                    </span>
                  </div>

                  <div className="message-subject">{msg.sujet}</div>
                  <div className="message-date">{msg.date}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">Aucun message trouve.</div>
            )}
          </div>

          <div className="message-details">
            <h2 className="section-title">Details du message</h2>

            {selectedMessage ? (
              <>
                <div className="details-box">
                  <div className="detail-row">
                    <span className="detail-label">Nom :</span>
                    <span>{selectedMessage.nom}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Prenom :</span>
                    <span>{selectedMessage.prenom}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Email :</span>
                    <span>{selectedMessage.email}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Sujet :</span>
                    <span>{selectedMessage.sujet}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Date :</span>
                    <span>{selectedMessage.date}</span>
                  </div>

                  <div className="detail-message">
                    <span className="detail-label">Message :</span>
                    <p>{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="reply-section">
                  <label className="reply-label">Reponse de l'administrateur</label>

                  <textarea
                    value={replyDrafts[selectedMessageId] || ""}
                    onChange={handleReplyChange}
                    placeholder="Ecrire une reponse..."
                    rows="6"
                    className="reply-textarea"
                  />

                  {replyError && <p className="reply-error">{replyError}</p>}

                  {successMessage && <div className="success-message">{successMessage}</div>}

                  <button className="reply-btn" onClick={handleSendReply} disabled={sendingReply}>
                    {sendingReply ? "Envoi..." : "Envoyer la reponse"}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">Aucun message selectionne.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestionMessages;
