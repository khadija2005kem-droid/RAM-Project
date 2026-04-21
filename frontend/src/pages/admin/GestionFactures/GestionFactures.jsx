import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import "./GestionFactures.css";

function GestionFactures() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processingIds, setProcessingIds] = useState([]);
  const messageTimeoutRef = useRef(null);

  const resetMessageTimer = useCallback((clearMessage) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      clearMessage();
      messageTimeoutRef.current = null;
    }, 4000);
  }, []);

  const showSuccessMessage = useCallback((message) => {
    setErrorMessage("");
    setSuccessMessage(message);
    resetMessageTimer(() => setSuccessMessage(""));
  }, [resetMessageTimer]);

  const showErrorMessage = useCallback((message) => {
    setSuccessMessage("");
    setErrorMessage(message);
    resetMessageTimer(() => setErrorMessage(""));
  }, [resetMessageTimer]);

  const loadPendingPaiements = useCallback(async () => {
    const result = await api.adminPaiementsAll();

    const pendingPaiements = (result?.data || []).map((paiement) => ({
      id: paiement.id,
      factureId: paiement.facture_id,
      nom: paiement.nom || paiement?.user?.nom || "",
      prenom: paiement.prenom || paiement?.user?.prenom || "",
      email: paiement.email || paiement?.user?.email || "",
      reference: paiement.numero_facture || paiement?.facture?.reference || "",
      montant: Number(paiement.montant) || 0,
      statut: "En attente",
    }));

    setPaiements(pendingPaiements);
    return pendingPaiements;
  }, []);

  useEffect(() => {
    const fetchPaiements = async () => {
      try {
        await loadPendingPaiements();
      } catch (error) {
        console.log("Admin payments fetch error:", error);
        showErrorMessage("Erreur lors du chargement des demandes de paiement.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaiements();
  }, [loadPendingPaiements, showErrorMessage]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleAction = async (id) => {
    if (processingIds.includes(id)) {
      return;
    }

    try {
      setSuccessMessage("");
      setErrorMessage("");
      setProcessingIds((prev) => [...prev, id]);

      await api.adminAcceptPaiement(id);
      showSuccessMessage("Demande de paiement acceptee avec succes.");

      setPaiements((prev) => prev.filter((paiement) => paiement.id !== id));
    } catch (error) {
      console.log("Admin payment accept error:", error);
      showErrorMessage("Erreur lors du traitement de la demande de paiement.");
    } finally {
      setProcessingIds((prev) => prev.filter((paiementId) => paiementId !== id));
    }
  };

  return (
    <div className="factures-container">
      <h1>Demandes de paiement</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error">{errorMessage}</div>}

      <table className="factures-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prenom</th>
            <th>Email</th>
            <th>Reference</th>
            <th>Montant (DH)</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {!loading && paiements.length === 0 ? (
            <tr>
              <td colSpan="8">Aucune demande de paiement en attente.</td>
            </tr>
          ) : (
            paiements.map((paiement) => (
              <tr key={paiement.id}>
                <td>{paiement.id}</td>
                <td>{paiement.nom}</td>
                <td>{paiement.prenom}</td>
                <td>{paiement.email}</td>
                <td>{paiement.reference}</td>
                <td>{paiement.montant}</td>
                <td>{paiement.statut}</td>
                <td className="actions-cell">
                  <button
                    className="btn-simple btn-accept-action"
                    onClick={() => handleAction(paiement.id)}
                    disabled={processingIds.includes(paiement.id)}
                  >
                    Accepter
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GestionFactures;
