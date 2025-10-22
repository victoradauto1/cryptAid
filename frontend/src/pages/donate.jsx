import Footer from "@/components/Footer";
import Head from "next/head";
import { useState } from "react";
import { getCampaign, donate } from "@/services/web3Service";
import Web3 from "web3";

export default function Donate() {
  const [campaignId, setCampaignId] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [donation, setDonation] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch() {
    if (!campaignId || campaignId < 1) {
      setMessage("❌ Digite um ID válido (maior que 0)");
      return;
    }

    setIsLoading(true);
    setMessage("🔍 Buscando campanha...");
    setCampaign(null);

    try {
      const result = await getCampaign(campaignId);
      console.log("Resultado bruto:", result);

      // Verify if the author address is not zero
      if (
        !result.author ||
        result.author === "0x0000000000000000000000000000000000000000"
      ) {
        setMessage(`❌ Campanha ${campaignId} não existe`);
        setIsLoading(false);
        return;
      }

      // Verify if is active
      if (!result.active) {
        setMessage(`❌ Campanha ${campaignId} está fechada`);
        setIsLoading(false);
        return;
      }

      const campaignData = {
        id: campaignId,
        author: result.author,
        title: result.title || "Sem título",
        description: result.description || "Sem descrição",
        videoUrl: result.videoUrl || "",
        imageUrl: result.imageUrl || "",
        balance: result.balance ? result.balance.toString() : "0",
        active: result.active,
      };

      console.log("Campanha processada:", campaignData);
      setCampaign(campaignData);
      setMessage("");
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDonate() {
    if (!donation || parseFloat(donation) <= 0) {
      setMessage("❌ Digite um valor válido maior que 0");
      return;
    }

    setIsLoading(true);
    setMessage("🦊 Confirme a transação na MetaMask...");

    try {
      console.log(`Iniciando doação de ${donation} ETH para campanha ${campaignId}`);
      
      const tx = await donate(campaignId, donation);
      
      console.log("Transação enviada:", tx);
      setMessage(
        `✅ Doação realizada!\n\nHash: ${tx.transactionHash}\n\nAtualize a página em alguns segundos para ver o novo saldo.`
      );
      setDonation("");

      // Atualiza a campanha após 5 segundos
      setTimeout(() => {
        handleSearch();
      }, 5000);
    } catch (error) {
      console.error("Erro completo:", error);

      if (error.code === 4001) {
        setMessage("❌ Você cancelou a transação");
      } else if (error.message?.includes("Campaign is not active")) {
        setMessage("❌ Esta campanha não está ativa");
      } else if (error.message?.includes("insufficient funds")) {
        setMessage("❌ Saldo insuficiente (inclua gas fee)");
      } else {
        setMessage(`❌ Erro: ${error.message || "Transação falhou"}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const balanceInEth = campaign?.balance
    ? (parseFloat(campaign.balance) / 1e18).toFixed(6)
    : "0";

  return (
    <>
      <Head>
        <title>CryptAid | Doar</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container py-5">
        <h1 className="display-5 fw-bold mb-4">CryptAid</h1>

        {!campaign ? (
          <div className="row">
            <div className="col-md-6">
              <h3 className="mb-4">Buscar Campanha</h3>
              <p className="text-muted mb-4">
                Digite o ID da campanha que deseja apoiar
              </p>

              <div className="input-group mb-3">
                <input
                  type="number"
                  className="form-control form-control-lg"
                  placeholder="ID da campanha"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  min="1"
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {message && (
                <div
                  className={`alert ${
                    message.includes("✅") ? "alert-success" : "alert-warning"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              className="btn btn-secondary mb-4"
              onClick={() => {
                setCampaign(null);
                setCampaignId("");
                setMessage("");
              }}
            >
              ← Buscar outra campanha
            </button>

            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card">
                  <div className="card-body">
                    {campaign.videoUrl ? (
                      <div className="ratio ratio-16x9">
                        <iframe
                          src={campaign.videoUrl}
                          title="Vídeo da campanha"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : campaign.imageUrl ? (
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="img-fluid w-100"
                        style={{ maxHeight: "500px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/800x500/6c757d/ffffff?text=Imagem+Indisponível";
                        }}
                      />
                    ) : (
                      <div
                        className="bg-light d-flex align-items-center justify-content-center"
                        style={{ height: "400px" }}
                      >
                        <p className="text-muted">Sem mídia disponível</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card">
                  <div className="card-body">
                    <h2 className="card-title">{campaign.title}</h2>
                    
                    <div className="mb-3">
                      <small className="text-muted">Criador:</small>
                      <p className="font-monospace small mb-0">
                        {campaign.author}
                      </p>
                    </div>

                    <p className="card-text">{campaign.description}</p>

                    <hr />

                    <div className="mb-4">
                      <h5>Total Arrecadado</h5>
                      <h3 className="text-primary">{balanceInEth} ETH</h3>
                      <small className="text-muted">Rede Sepolia</small>
                    </div>

                    <hr />

                    <h5 className="mb-3">Fazer Doação</h5>
                    
                    <div className="btn-group w-100 mb-3" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setDonation("0.005")}
                        disabled={isLoading}
                      >
                        0.005 ETH<br />
                        <small>~$20</small>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setDonation("0.01")}
                        disabled={isLoading}
                      >
                        0.01 ETH<br />
                        <small>~$40</small>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setDonation("0.025")}
                        disabled={isLoading}
                      >
                        0.025 ETH<br />
                        <small>~$100</small>
                      </button>
                    </div>

                    <p className="text-muted small mb-2">Ou digite um valor personalizado:</p>
                    <div className="input-group mb-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.005 (aprox. $20)"
                        value={donation}
                        onChange={(e) => setDonation(e.target.value)}
                        step="0.001"
                        min="0.001"
                        max="1"
                        disabled={isLoading}
                      />
                      <span className="input-group-text">ETH</span>
                    </div>

                    <button
                      className="btn btn-success btn-lg w-100"
                      onClick={handleDonate}
                      disabled={isLoading || !donation || parseFloat(donation) <= 0}
                    >
                      {isLoading ? "Processando..." : "💚 Doar Agora"}
                    </button>

                    {message && (
                      <div
                        className={`alert mt-3 ${
                          message.includes("✅")
                            ? "alert-success"
                            : "alert-warning"
                        }`}
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}