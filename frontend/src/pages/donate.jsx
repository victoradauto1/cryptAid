import Footer from "@/components/Footer";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getCampaign, donate } from "@/services/web3Service";

export default function Donate() {
  const [campaign, setCampaign] = useState({
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    balance: 0,
  });
  const [donation, setDonation] = useState("");
  const [message, setMessage] = useState("");

  function onChangeId(evt) {
    setCampaign(prevState => ({ ...prevState, id: evt.target.value }));
  }

  function btnSearchClick() {
    if (!campaign.id) {
      setMessage("Por favor, insira um ID válido!");
      return;
    }

    setMessage("Buscando... Aguarde...");
    getCampaign(campaign.id)
      .then((result) => {
        console.log("Campanha encontrada:", result);
        setMessage("");
        setCampaign({
          ...result,
          id: campaign.id,
          balance: result.balance ? BigInt(result.balance).toString() : "0",
          author: result.author || "Endereço não disponível",
          imageUrl: result.imageUrl || "",
          videoUrl: result.videoUrl || "",
        });
      })
      .catch((err) => {
        console.error("Erro ao buscar campanha:", err);
        setMessage(err.message || "Erro ao buscar campanha");
        setCampaign({
          title: "",
          description: "",
          imageUrl: "",
          videoUrl: "",
          balance: 0,
        });
      });
  }

  function onChangeValue(evt) {
    setDonation(evt.target.value);
  }

  function btnDonateClick() {
    if (!donation || Number(donation) <= 0) {
      setMessage("Por favor, insira um valor válido!");
      return;
    }

    setMessage("Processando doação... Aguarde...");
    donate(campaign.id, donation)
      .then((tx) => {
        console.log("Transação confirmada:", tx);
        setMessage(
          "✅ Doação realizada com sucesso! Em alguns minutos o saldo será atualizado."
        );
        setDonation("");
      })
      .catch((err) => {
        console.error("Erro na doação:", err);
        setMessage(err.message || "Erro ao realizar doação");
      });
  }

  const balanceInEth =
    campaign.balance && campaign.balance !== "0"
      ? (Number(campaign.balance) / 10 ** 18).toFixed(4)
      : "0";

  return (
    <>
      <Head>
        <title>Crypt Aid | Fazer Doação</title>
        <meta charSet="utf-8" />
        <meta name="description" content="Faça uma doação para uma campanha" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="container">
        <h1 className="display-5 fw-bold text-body-emphasis lh-1 mb-3">
          Crypt Aid
        </h1>

        {!campaign.id ? (
          <>
            <p className="mb-5">Qual é o ID da campanha que procura?</p>
            <div className="col-3">
              <div className="input-group mb-3">
                <input
                  type="number"
                  id="campaignId"
                  className="form-control"
                  onChange={onChangeId}
                  placeholder="Digite o ID da campanha"
                  min="0"
                />
                <input
                  type="button"
                  value="Buscar"
                  className="btn btn-primary"
                  onClick={btnSearchClick}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <p>
              Verifique se esta é a campanha certa antes de finalizar a doação.
            </p>
            <hr />
            <div className="row flex-lg-row-reverse align-items-center g-5">
              <div className="col-7">
                {campaign.videoUrl ? (
                  <iframe
                    width="100%"
                    height="480"
                    src={campaign.videoUrl}
                    title="Video da campanha"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="d-block mx-lg-auto img-fluid"
                    style={{
                      maxWidth: "640px",
                      maxHeight: "480px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/640x480?text=Imagem+Indisponível";
                    }}
                  />
                ) : (
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ width: "640px", height: "480px" }}
                  >
                    <p className="text-muted">Sem mídia disponível</p>
                  </div>
                )}
              </div>
              <div className="col-5">
                <h2>{campaign.title || "Campanha"}</h2>
                <p>
                  <strong>Autor:</strong> {campaign.author || "Desconhecido"}
                </p>
                <p className="mb-3">{campaign.description}</p>
                {campaign.videoUrl && (
                  <p className="text-muted">
                    Assista ao vídeo ao lado para entender melhor nossa campanha.
                  </p>
                )}
                <div className="mt-5 pt-3 border-top">
                  <p className="mb-3">
                    <strong>Total arrecadado:</strong> {balanceInEth} ETH
                  </p>
                  <p className="mb-3">
                    Quanto você quer doar em ETH (Sepolia)?
                  </p>
                  <div className="input-group mb-3">
                    <input
                      type="number"
                      className="form-control"
                      onChange={onChangeValue}
                      value={donation}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                    />
                    <span className="input-group-text">ETH</span>
                    <button
                      className="btn btn-primary"
                      onClick={btnDonateClick}
                      disabled={!donation || Number(donation) <= 0}
                    >
                      Doar
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setCampaign({
                        title: "",
                        description: "",
                        imageUrl: "",
                        videoUrl: "",
                        balance: 0,
                      })
                    }
                  >
                    Buscar outra campanha
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {message && (
          <div
            className={`alert ${
              message.includes("✅") ? "alert-success" : "alert-danger"
            } p-3 mt-4 col-6`}
            role="alert"
          >
            {message}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}