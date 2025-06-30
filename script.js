
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-doacao');
    const pixArea = document.getElementById('pix-area');
    const qrCodeDiv = document.getElementById('pix-qrcode');
    const copiaColaText = document.getElementById('pix-copia-cola');
    const statusPagamento = document.getElementById('status-pagamento');
    const btnDownload = document.getElementById('btn-download');

    let currentPaymentId = null;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const valor = document.getElementById('valor').value;

        form.querySelector('button').innerText = 'Gerando...';
        form.querySelector('button').disabled = true;

        try {
            const response = await fetch('voiceless-adela-dniel23-992f12ba.koyeb.app/gerar-pagamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ valor, nome }),
            });

            const data = await response.json();

            if (data.id) {
                currentPaymentId = data.id;
                qrCodeDiv.innerHTML = `<img src="data:image/png;base64,${data.qr_code_base64}" alt="PIX QR Code">`;
                copiaColaText.value = data.copia_e_cola;
                pixArea.classList.remove('hidden');
                form.classList.add('hidden');

                verificarStatusPagamento();
            } else {
                alert('Erro ao gerar o PIX. Tente novamente.');
            }

        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro no servidor. Tente mais tarde.');
        } finally {
            form.querySelector('button').innerText = 'Gerar PIX para Doação';
            form.querySelector('button').disabled = false;
        }
    });

    function verificarStatusPagamento() {
        if (!currentPaymentId) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`voiceless-adela-dniel23-992f12ba.koyeb.app/status-pagamento/${currentPaymentId}`);
                const data = await response.json();

                if (data.status === 'approved') {
                    clearInterval(interval);
                    statusPagamento.innerText = 'Pagamento confirmado! Seu certificado está pronto.';
                    statusPagamento.style.color = 'green';
                    btnDownload.disabled = false;
                    btnDownload.onclick = () => {
                        // A URL agora aponta para a imagem do certificado
                        window.open(`voiceless-adela-dniel23-992f12ba.koyeb.app/gerar-certificado?id=${currentPaymentId}`, '_blank');
                    };
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        }, 5000);
    }
});
