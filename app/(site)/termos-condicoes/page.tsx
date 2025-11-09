import React from "react";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Termos e Condições | Jocril Loja Online",
  description:
    "Termos e Condições Gerais de Utilização, Política de Devolução, Modalidades de Pagamento e Condições de Expedição da Jocril.",
};

export default function TermosPage() {
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
        <section className="mt-10" aria-labelledby="terms-heading">
          <h1
            id="terms-heading"
            className={cn(
              "mb-6 text-4xl lg:text-5xl font-bold text-foreground"
            )}
          >
            Termos e Condições
          </h1>
          <p className="mb-6 text-mono-xs text-base-400 max-w-3xl">
            Consulte as condições gerais de utilização, política de devolução,
            modalidades de pagamento e condições de expedição dos produtos Jocril.
          </p>
        </section>

        {/* Expedição e Entregas */}
        <section
          aria-labelledby="expedition-methods"
          className="mt-8"
        >
          <h2
            id="expedition-methods"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Métodos de Expedição
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            Para Portugal Continental, Açores e Madeira, a Jocril utiliza serviços de entrega através de transportadoras selecionadas pela empresa.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            As mercadorias são transportadas por conta e risco do cliente. A contratação de seguro de remessas apenas é efetuada mediante solicitação expressa do cliente.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            <strong>Nota:</strong> É possível proceder ao levantamento das encomendas nas nossas instalações, devendo previamente confirmar que a encomenda se encontra disponível para recolha.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Reclamações não serão aceites decorridos 8 dias após a data de receção.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Os valores apresentados são considerados válidos, ressalvando-se eventuais erros de sistema. As especificações e valores podem sofrer alterações sem comunicação prévia. Todos os valores mencionados no website excluem IVA à taxa legal em vigor. Todos os produtos e serviços comercializados estão sujeitos à aplicação de IVA conforme legislação vigente.
          </p>
          <p className="mb-0 text-mono-xs text-base-400">
            Os encargos de transporte são da inteira responsabilidade do cliente final.
          </p>
        </section>

        {/* Pagamentos */}
        <section
          aria-labelledby="payments"
          className="mt-8"
        >
          <h2
            id="payments"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Pagamentos
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            O pagamento das encomendas processa-se da seguinte forma:
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            <strong>100%</strong> aquando da realização da encomenda.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            A Jocril reserva-se a prerrogativa de alterar, em qualquer momento, as informações e ofertas comerciais relativas a:
          </p>
          <ul className="mb-3 text-mono-xs text-base-400 list-disc list-inside space-y-1">
            <li>Artigos disponibilizados;</li>
            <li>Valores praticados;</li>
            <li>Campanhas promocionais;</li>
            <li>Termos comerciais e serviços oferecidos.</li>
          </ul>
        </section>

        {/* Modalidades de Pagamento */}
        <section
          aria-labelledby="payment-methods"
          className="mt-8"
        >
          <h2
            id="payment-methods"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Modalidades de Pagamento
          </h2>
          
          <h3 className="mb-3 text-2xl lg:text-3xl font-bold text-foreground">
            Pagamento através de cartão de crédito via PayPal
          </h3>
          <p className="mb-3 text-mono-xs text-base-400">
            Para pagamentos processados via PayPal, é obrigatório que o cliente valide a morada de envio na plataforma PayPal.com. As encomendas pagas através desta modalidade serão expedidas exclusivamente para a morada registada no PayPal.
          </p>
          <p className="mb-6 text-mono-xs text-base-400">
            Esta modalidade de pagamento requer aprovação prévia.
          </p>

          <h3 className="mb-3 text-2xl lg:text-3xl font-bold text-foreground">
            Pagamento por transferência bancária
          </h3>
          <p className="mb-3 text-mono-xs text-base-400">
            A transferência bancária deve ser concretizada no prazo máximo de 3 (três) dias após a realização da encomenda. Ultrapassado este período, a encomenda será automaticamente cancelada.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Para agilizar o processamento da sua encomenda, recomendamos que, ao efetuar a transferência, inclua a referência do pagamento ou, alternativamente, envie o comprovativo por correio eletrónico para <a href="mailto:info@jocril.com" className="text-accent-100 hover:underline">info@jocril.com</a> indicando o número da encomenda.
          </p>
          <p className="mb-0 text-mono-xs text-base-400">
            Após confirmação do pagamento, a Jocril procederá à expedição da encomenda para a morada fornecida, num prazo estimado de 5 a 8 dias úteis (exceto em casos de indisponibilidade de stock ou prazos de fabrico).
          </p>
        </section>

        {/* Condições Gerais de Utilização */}
        <section
          aria-labelledby="general-conditions"
          className="mt-8"
        >
          <h2
            id="general-conditions"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Condições Gerais de Utilização
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-2xl lg:text-3xl font-bold text-foreground">
                Artigo 1.º
              </h3>
              <p className="mb-3 text-mono-xs text-base-400">
                1.1. Antes de aceitar as presentes Condições Gerais, o Utilizador deve proceder à sua leitura completa e atenta. Caso surjam dúvidas, poderá solicitar esclarecimentos através de correspondência ou correio eletrónico para <a href="mailto:info@jocril.com" className="text-accent-100 hover:underline">info@jocril.com</a>.
              </p>
              <p className="mb-0 text-mono-xs text-base-400">
                1.2. Quaisquer pedidos de esclarecimento, reclamações, sugestões ou outras comunicações deverão ser dirigidos à Jocril através dos meios indicados, sendo respondidos no prazo de 8 (oito) dias úteis.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-2xl lg:text-3xl font-bold text-foreground">
                Artigo 2.º
              </h3>
              <p className="mb-3 text-mono-xs text-base-400">
                2.1. A prestação de serviços da Jocril ao Utilizador rege-se pelas presentes Condições Gerais e pela legislação em vigor.
              </p>
              <p className="mb-3 text-mono-xs text-base-400">
                2.2. O registo como Utilizador confere acesso aos serviços disponibilizados pela Jocril.
              </p>
              <p className="mb-0 text-mono-xs text-base-400">
                2.3. O registo realiza-se mediante preenchimento dos dados de identificação e aceitação expressa das presentes Condições Gerais.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-2xl lg:text-3xl font-bold text-foreground">
                Artigo 3.º
              </h3>
              <p className="mb-3 text-mono-xs text-base-400">
                3.1. A atividade da Jocril compreende o comércio eletrónico de produtos e serviços.
              </p>
              <p className="mb-3 text-mono-xs text-base-400">
                3.2. Os valores dos produtos são expressos em euros (EUR) e encontram-se disponíveis no website, acompanhados das modalidades de pagamento disponíveis.
              </p>
              <p className="mb-3 text-mono-xs text-base-400">
                3.3. O acesso aos serviços da Jocril em cada sessão de utilização depende da introdução do nome de utilizador e da palavra-passe atribuídos ao Utilizador após o registo.
              </p>
              <p className="mb-3 text-mono-xs text-base-400">
                3.4. O Utilizador deve manter confidencialidade absoluta sobre os seus dados de acesso e comunicar à Jocril caso suspeite de utilização indevida.
              </p>
              <p className="mb-3 text-mono-xs text-base-400">
                3.5. A Jocril pode alterar nomes de utilizador e palavras-passe por motivos de segurança e desativar contas inativas por período superior a seis meses.
              </p>
              <p className="mb-0 text-mono-xs text-base-400">
                3.6. A Jocril reserva-se o direito de modificar unilateralmente estas Condições Gerais, devendo o Utilizador aceitar as modificações para continuar a beneficiar dos serviços.
              </p>
            </div>
          </div>
        </section>

        {/* Cancelamentos, Trocas e Devoluções */}
        <section
          aria-labelledby="returns-policy"
          className="mt-8"
        >
          <h2
            id="returns-policy"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Cancelamentos, Trocas e Devoluções
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            Os artigos comercializados destinam-se a utilização profissional. Qualquer situação de cancelamento, troca ou devolução será tratada nos termos da legislação portuguesa aplicável.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Os produtos devolvidos devem cumprir os seguintes requisitos:
          </p>
          <ul className="mb-3 text-mono-xs text-base-400 list-disc list-inside space-y-1">
            <li>Encontrar-se no seu estado original, sem utilização prévia, na embalagem original com todos os acessórios incluídos e respetivos números de série e selos do fabricante, num período de 14 dias após a aquisição;</li>
            <li>Em situações de danos de transporte, a reclamação deve ser apresentada no prazo de 24 horas após a receção do produto.</li>
          </ul>
          <p className="mb-3 text-mono-xs text-base-400">
            Salvo defeito ou desconformidade, não são aceites trocas ou devoluções de produtos consumíveis.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Não são aceites devoluções/trocas de artigos personalizados ou produtos descontinuados encomendados especificamente pelo consumidor.
          </p>
          <p className="mb-0 text-mono-xs text-base-400">
            O cliente suporta as despesas de devolução em caso de resolução do contrato.
          </p>
        </section>

        {/* Tolerâncias e Aceitação de Variações */}
        <section
          aria-labelledby="tolerances"
          className="mt-8"
        >
          <h2
            id="tolerances"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Tolerâncias e Aceitação de Variações
          </h2>
          <ul className="mb-3 text-mono-xs text-base-400 list-disc list-inside space-y-1">
            <li>Admite-se uma variação na espessura até 10%;</li>
            <li>Não são aceites devoluções de produtos personalizados;</li>
            <li>Tolerância para diferenças na tonalidade impressa até 15%.</li>
          </ul>
          <p className="mb-0 text-mono-xs text-base-400">
            <strong>Importante:</strong> Qualquer peça de acrílico não pode ser limpa com produtos que contenham álcool. Para limpeza de peças acrílicas, utilize água e sabão neutro.
          </p>
        </section>

        {/* Resolução Alternativa de Litígios */}
        <section
          aria-labelledby="alternative-dispute"
          className="mt-8"
        >
          <h2
            id="alternative-dispute"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Resolução Alternativa de Litígios (RAL)
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            Em conformidade com a Lei nº 144/2015, de 8 de setembro (aplicável a consumidores), qualquer litígio pode ser submetido ao Centro de Arbitragem de Conflitos de Consumo de Castelo Branco.
          </p>
          <p className="mb-0 text-mono-xs text-base-400">
            Web: <a href="https://www.centroarbitragemlisboa.pt" className="text-accent-100 hover:underline" target="_blank" rel="noopener noreferrer">www.centroarbitragemlisboa.pt</a>
          </p>
        </section>

        {/* Realização de Encomenda Online */}
        <section
          aria-labelledby="online-orders"
          className="mt-8"
        >
          <h2
            id="online-orders"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Realização de Encomenda Online
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            Para efetuar compras na loja online, é necessário efetuar registo como Cliente. Após a conclusão da compra, o cliente receberá um e-mail de confirmação.
          </p>
          <p className="mb-0 text-mono-xs text-base-400">
            A Jocril informa que todas as campanhas promocionais têm um stock limitado e, na falta de disponibilidade do produto, compromete-se a informar o Cliente com a maior brevidade possível.
          </p>
        </section>

        {/* Privacidade e Proteção de Dados */}
        <section
          aria-labelledby="privacy-data"
          className="mt-8"
        >
          <h2
            id="privacy-data"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Privacidade e Proteção de Dados Pessoais
          </h2>
          <p className="mb-3 text-mono-xs text-base-400">
            Nos termos da Lei 67/98 de 26 de outubro, sobre Proteção de Dados Pessoais, e do Regulamento Geral sobre a Proteção de Dados (RGPD), informamos que os dados recolhidos no website da Jocril são da responsabilidade da Jocril - Sociedade Transformadora De Acrílicos, Lda e destinam-se ao processamento de encomendas, comunicação com os Clientes, análise estatística e marketing direto.
          </p>
          <p className="mb-3 text-mono-xs text-base-400">
            Os clientes podem solicitar acesso, retificação ou eliminação dos seus dados através dos seguintes meios:
          </p>
          <div className="mb-0 text-mono-xs text-base-400 space-y-2">
            <p><strong>Email:</strong> <a href="mailto:info@jocril.com" className="text-accent-100 hover:underline">info@jocril.com</a></p>
            <p><strong>Carta:</strong> Rua Sebastião e Silva 79, 2745-838 Massamá (Zona Industrial), Lisboa</p>
            <p><strong>Telefone:</strong> +351 21 471 89 03 (segunda a sexta-feira, das 9h às 13h e das 14h às 18h)</p>
            <p><strong>Website:</strong> Jocril.com</p>
          </div>
        </section>

        {/* Footer Info */}
        <section
          aria-labelledby="company-info"
          className="mt-12 border-t border-base-800/70 pt-8"
        >
          <h2
            id="company-info"
            className="mb-4 text-3xl lg:text-4xl font-bold text-foreground"
          >
            Informações da Empresa
          </h2>
          <div className="text-mono-xs text-base-400 space-y-1">
            <p><strong>Jocril - Sociedade Transformadora De Acrílicos, Lda</strong></p>
            <p><strong>NIF:</strong> PT 502 268 336</p>
          </div>
        </section>
      </main>
    </>
  );
}