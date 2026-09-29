import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // O formulário aceita arquivos de até 20 MB. A margem cobre os metadados
    // multipart adicionados pelo navegador antes de o Route Handler validar.
    proxyClientMaxBodySize: "22mb",
  },
};

export default nextConfig;
