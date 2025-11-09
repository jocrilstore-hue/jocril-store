import React from "react";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Política de Privacidade | Jocril Loja Online",
  description:
    "Política de Privacidade da Jocril - Sociedade Transformadora De Acrílicos, Lda. Informações sobre tratamento de dados pessoais, cookies e direitos do utilizador.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <>
      <main
        className={cn(
          "flex-1",
          "px-4 lg:px-9",
          "pb-16 lg:pb-24",
          "mx-auto w-full max-w-5xl"
        )}
      >
        <section className="mt-10" aria-labelledby="privacy-heading">
          <h1
            id="privacy-heading"
            className="text-4xl lg:text-5xl font-bold text-foreground"
          >
            Política de Privacidade
          </h1>
          <p className="mb-6 text-base lg:text-lg text-base-400 max-w-3xl">
            A Jocril compromete-se a proteger a sua privacidade e a tratar os seus dados pessoais com o máximo cuidado e segurança.
          </p>
        </section>

        {/* Introdução */}
        <section
          aria-labelledby="introduction"
          className="mt-8"
        >
          <h2
            id="introduction"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Introdução
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            A presente Política de Privacidade explica como a Jocril - Sociedade Transformadora De Acrílicos, Lda, com sede na Rua Sebastião e Silva 79, 2745-838 Massamá (Zona Industrial), Lisboa, NIF PT 502 268 336, procede ao tratamento dos dados pessoais dos seus utilizadores e clientes.
          </p>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            O presente documento abrange o tratamento de dados realizado no website Jocril.com, bem como em quaisquer comunicações relacionadas com os nossos serviços.
          </p>
          <p className="mb-0 text-base lg:text-lg text-base-400">
            Esta política está em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) e a legislação nacional aplicável.
          </p>
        </section>

        {/* Dados que Recolhemos */}
        <section
          aria-labelledby="data-collection"
          className="mt-8"
        >
          <h2
            id="data-collection"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Dados que Recolhemos
          </h2>
          
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
            Dados de Identificação e Contacto
          </h3>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Recolhemos informações básicas de identificação e contacto, incluindo:
          </p>
          <ul className="mb-6 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li>Nome completo</li>
            <li>Endereço de email</li>
            <li>Número de telefone</li>
            <li>Endereço de morada completa</li>
            <li>Informações de faturação</li>
          </ul>

          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
            Dados de Navegação e Utilização
          </h3>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Quando visita o nosso website, recolhemos automaticamente:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li>Endereço IP</li>
            <li>Tipo de navegador e dispositivo</li>
            <li>Páginas visitadas e tempo de permanência</li>
            <li>Data e hora de acesso</li>
            <li>Origem do tráfego</li>
          </ul>
        </section>

        {/* Como Utilizamos os Dados */}
        <section
          aria-labelledby="data-usage"
          className="mt-8"
        >
          <h2
            id="data-usage"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Como Utilizamos os seus Dados
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Os seus dados pessoais são utilizados para:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li><strong>Processamento de Encomendas:</strong> Para processar, confirmar e expedir as suas encomendas;</li>
            <li><strong>Comunicação:</strong> Para responder às suas questões e fornecer informações sobre os nossos produtos;</li>
            <li><strong>Gestão de Conta:</strong> Para gerir o seu registo e acesso à sua conta de cliente;</li>
            <li><strong>Marketing:</strong> Para enviar informações sobre produtos, serviços e promoções (apenas com o seu consentimento);</li>
            <li><strong>Melhoria do Website:</strong> Para analisar o tráfego e melhorar a experiência do utilizador;</li>
            <li><strong>Cumprimento Legal:</strong> Para cumprir obrigações legais e regulamentares.</li>
          </ul>
        </section>

        {/* Base Legal */}
        <section
          aria-labelledby="legal-basis"
          className="mt-8"
        >
          <h2
            id="legal-basis"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Base Legal para o Tratamento
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            O tratamento dos seus dados pessoais baseia-se nas seguintes fundamentações legais:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li><strong>Execução de Contrato:</strong> Para processar e entregar as suas encomendas;</li>
            <li><strong>Interesse Legítimo:</strong> Para melhorar os nossos serviços e comunicar com os clientes;</li>
            <li><strong>Consentimento:</strong> Para atividades de marketing direto;</li>
            <li><strong>Obrigação Legal:</strong> Para cumprir requisitos contabilísticos e fiscais.</li>
          </ul>
        </section>

        {/* Partilha de Dados */}
        <section
          aria-labelledby="data-sharing"
          className="mt-8"
        >
          <h2
            id="data-sharing"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Partilha de Dados
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            A Jocril não vende, aluga ou partilha os seus dados pessoais com terceiros, exceto nas seguintes situações:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li><strong>Prestadores de Serviços:</strong> Com empresas que nos auxiliam na operação do website e serviços (serviços de pagamento, expedição);</li>
            <li><strong>Obrigação Legal:</strong> Quando exigido por lei ou por autoridades competentes;</li>
            <li><strong>Proteção de Direitos:</strong> Para proteger os direitos, propriedade ou segurança da Jocril, dos nossos utilizadores ou do público.</li>
          </ul>
        </section>

        {/* Conservação de Dados */}
        <section
          aria-labelledby="data-retention"
          className="mt-8"
        >
          <h2
            id="data-retention"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Conservação de Dados
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Os seus dados pessoais são conservados apenas pelo tempo necessário para cumprir os propósitos para os quais foram recolhidos:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li><strong>Dados de Cliente:</strong> Conservados enquanto mantiver uma conta ativa e pelos 10 anos seguintes à última compra (obrigações fiscais);</li>
            <li><strong>Dados de Marketing:</strong> Conservados até revogar o consentimento;</li>
            <li><strong>Dados de Navegação:</strong> Conservados por um período máximo de 24 meses;</li>
            <li><strong>Dados de Encomendas:</strong> Conservados por 10 anos após a data da encomenda (obrigações contabilísticas).</li>
          </ul>
        </section>

        {/* Os seus Direitos */}
        <section
          aria-labelledby="user-rights"
          className="mt-8"
        >
          <h2
            id="user-rights"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Os seus Direitos
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Nos termos do RGPD, tem os seguintes direitos:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li><strong>Direito de Acesso:</strong> Solicitar informação sobre os dados que tratamos sobre si;</li>
            <li><strong>Direito de Retificação:</strong> Pedir a correção de dados incorretos ou incompletos;</li>
            <li><strong>Direito ao Apagamento:</strong> Solicitar a eliminação dos seus dados ("direito a ser esquecido");</li>
            <li><strong>Direito à Portabilidade:</strong> Receber os seus dados num formato estruturado;</li>
            <li><strong>Direito de Oposição:</strong> Opor-se ao tratamento dos seus dados para fins de marketing;</li>
            <li><strong>Direito à Limitação:</strong> Pedir a limitação do tratamento em certas circunstâncias;</li>
            <li><strong>Direito de Retirar o Consentimento:</strong> Retirar o consentimento para atividades de marketing.</li>
          </ul>
        </section>

        {/* Cookies */}
        <section
          aria-labelledby="cookies"
          className="mt-8"
        >
          <h2
            id="cookies"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Cookies
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            O nosso website utiliza cookies para melhorar a sua experiência de navegação. Os cookies são pequenos ficheiros armazenados no seu dispositivo que nos ajudam a:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li>Manter a sua sessão ativa</li>
            <li>Personalizar o conteúdo do website</li>
            <li>Analisar o tráfego e desempenho</li>
            <li>Melhorar a funcionalidade do website</li>
          </ul>
          <p className="mb-0 text-base lg:text-lg text-base-400">
            Pode gerir as preferências de cookies nas definições do seu navegador.
          </p>
        </section>

        {/* Segurança */}
        <section
          aria-labelledby="security"
          className="mt-8"
        >
          <h2
            id="security"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Segurança dos Dados
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            A Jocril implementa medidas técnicas e organizacionais adequadas para proteger os seus dados pessoais contra:
          </p>
          <ul className="mb-3 text-base lg:text-lg text-base-400 list-disc list-inside space-y-1">
            <li>Acesso não autorizado</li>
            <li>Divulgação, alteração ou destruição não autorizada</li>
            <li>Perda acidental</li>
            <li>Todos os outros tratamentos não autorizados</li>
          </ul>
          <p className="mb-0 text-base lg:text-lg text-base-400">
            Estas medidas incluem encriptação, controlo de acesso, auditorias regulares e formação do pessoal.
          </p>
        </section>

        {/* Contacto */}
        <section
          aria-labelledby="contact"
          className="mt-8"
        >
          <h2
            id="contact"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Contacto
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            Para exercer os seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados pessoais, pode contactar-nos através dos seguintes meios:
          </p>
          <div className="mb-0 text-base lg:text-lg text-base-400 space-y-2">
            <p><strong>Email:</strong> <a href="mailto:info@jocril.com" className="text-accent-100 hover:underline">info@jocril.com</a></p>
            <p><strong>Carta:</strong> Rua Sebastião e Silva 79, 2745-838 Massamá (Zona Industrial), Lisboa</p>
            <p><strong>Telefone:</strong> +351 21 471 89 03 (segunda a sexta-feira, das 9h às 13h e das 14h às 18h)</p>
            <p><strong>Website:</strong> Jocril.com</p>
          </div>
        </section>

        {/* Alterações */}
        <section
          aria-labelledby="changes"
          className="mt-8"
        >
          <h2
            id="changes"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Alterações à Política de Privacidade
          </h2>
          <p className="mb-3 text-base lg:text-lg text-base-400">
            A Jocril reserva-se o direito de alterar a presente Política de Privacidade a qualquer momento. As alterações serão comunicadas através do website e, quando apropriado, por email.
          </p>
          <p className="mb-0 text-base lg:text-lg text-base-400">
            Recomendamos a consulta regular desta política para estar informado sobre como protegemos os seus dados.
          </p>
        </section>

        {/* Data de Atualização */}
        <section
          aria-labelledby="last-update"
          className="mt-8 border-t border-base-800/70 pt-8"
        >
          <h2
            id="last-update"
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            Informações da Empresa
          </h2>
          <div className="text-base lg:text-lg text-base-400 space-y-1">
            <p><strong>Jocril - Sociedade Transformadora De Acrílicos, Lda</strong></p>
            <p><strong>NIF:</strong> PT 502 268 336</p>
            <p><strong>Última atualização:</strong> 9 de novembro de 2025</p>
          </div>
        </section>
      </main>
    </>
  );
}