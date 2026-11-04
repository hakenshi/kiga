/**
 * Converte erros técnicos do SQLite / React Native em mensagens diretas
 * e compreensíveis para o ser humano, sem jargões de backend.
 */
export function formatAppError(err: unknown, fallbackMessage = "Falha ao processar a ação."): {
  message: string;
  technicalDetails?: string;
} {
  if (!err) {
    return { message: fallbackMessage };
  }

  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

  const lower = rawMessage.toLowerCase();

  let message = fallbackMessage;

  if (lower.includes("enospc") || lower.includes("full") || lower.includes("disk")) {
    message = "Armazenamento do celular insuficiente para concluir a operação.";
  } else if (lower.includes("sqlite_busy") || lower.includes("locked")) {
    message = "Banco de dados ocupado em segundo plano. Tente novamente em instantes.";
  } else if (lower.includes("foreign key") || lower.includes("constraint")) {
    message = "Não foi possível vincular as tags a esta entrada.";
  } else if (lower.includes("enoent") || lower.includes("not found")) {
    message = "Arquivo de imagem não encontrado ou removido da galeria.";
  } else if (lower.includes("eacces") || lower.includes("permission")) {
    message = "Permissão negada para acessar as fotos ou armazenamento.";
  } else if (lower.includes("network") || lower.includes("fetch")) {
    message = "Sem conexão com a rede.";
  } else if (err instanceof Error && err.message && err.message.length < 80) {
    message = err.message;
  }

  return {
    message,
    technicalDetails: rawMessage,
  };
}
