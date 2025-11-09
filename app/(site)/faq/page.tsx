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
  title: "Perguntas Frequentes (FAQ) | Jocril Loja Online",
  description:
    "Perguntas frequentes sobre envios, devoluções, pagamentos, produtos, contas, suporte e política de entregas da Jocril.",
};

const faqSections = [
  {
    id: "envios-entregas",
    title: "Envios e Entregas",
    items: [
      {
        q: "Quanto tempo demora a receber a minha encomenda?",
        a: "As encomendas são normalmente expedidas no prazo de 2 dias após confirmação do pagamento. O tempo de entrega depende da localização, mas geralmente varia entre 5 a 8 dias úteis para Portugal Continental, Açores e Madeira.",
      },
      {
        q: "Que transportadora utilizam?",
        a: "Utilizamos a Chronopost para todas as entregas em Portugal Continental, Açores e Madeira.",
      },
      {
        q: "Posso acompanhar a minha encomenda?",
        a: "Sim. Assim que a encomenda for expedida, receberá um link de rastreamento por email que permite acompanhar o estado da sua entrega online.",
      },
      {
        q: "Quanto custam os envios?",
        a: "Os custos de envio incluem despesas de manuseamento (fixas) e transporte (variáveis conforme o peso). O valor exato é calculado automaticamente no checkout antes de finalizar a compra.",
      },
      {
        q: "Posso levantar a encomenda nas vossas instalações?",
        a: "Sim, é possível proceder ao levantamento direto nas nossas instalações em Massamá, após confirmação de que a encomenda se encontra disponível para recolha.",
      },
      {
        q: "Enviam para as ilhas?",
        a: "Sim, realizamos envios para Açores e Madeira através da Chronopost.",
      },
      {
        q: "A minha encomenda tem seguro?",
        a: "Sim, todas as encomendas são despachadas com seguro de carga. O cliente pode solicitar cobertura adicional mediante pedido expresso.",
      },
    ],
  },
  {
    id: "devolucoes-trocas",
    title: "Devoluções e Trocas",
    items: [
      {
        q: "Posso devolver um produto?",
        a: "Sim. Os produtos podem ser devolvidos no prazo de 14 dias após a receção, desde que se encontrem no estado original, sem utilização e na embalagem original com todos os acessórios incluídos.",
      },
      {
        q: "Que produtos não podem ser devolvidos?",
        a: "Não são aceites devoluções de produtos personalizados, produtos consumíveis (salvo defeito ou desconformidade) e produtos descontinuados encomendados especialmente.",
      },
      {
        q: "Como procedo a uma devolução?",
        a: "Contacte-nos através do email info@jocril.com ou telefone +351 21 471 89 03 indicando o número da encomenda e o motivo da devolução. Forneceremos as instruções necessárias.",
      },
      {
        q: "Quem paga os custos de devolução?",
        a: "As despesas de devolução são da responsabilidade do cliente em caso de resolução do contrato, exceto em situações de defeito ou desconformidade.",
      },
      {
        q: "E se a encomenda chegar danificada?",
        a: "Em caso de danos durante o transporte, dispõe de 24 horas para enviar evidência fotográfica dos danos para info@jocril.com. Enviaremos uma nova encomenda sem custos adicionais.",
      },
      {
        q: "Quanto tempo tenho para reclamar?",
        a: "Para danos de transporte: 24 horas após receção. Para outras reclamações: até 8 dias após a data de receção.",
      },
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    items: [
      {
        q: "Que formas de pagamento aceitam?",
        a: "Aceitamos pagamento por cartão de crédito via PayPal e transferência bancária.",
      },
      {
        q: "Quando é debitado o pagamento?",
        a: "O pagamento é processado a 100% no momento da realização da encomenda.",
      },
      {
        q: "Quanto tempo tenho para efetuar a transferência bancária?",
        a: "A transferência bancária deve ser concretizada no prazo máximo de 3 dias após a realização da encomenda. Após este período, a encomenda será automaticamente cancelada.",
      },
      {
        q: "Como confirmo o pagamento por transferência?",
        a: "Envie o comprovativo de transferência para info@jocril.com indicando o número da encomenda, ou inclua a referência do pagamento no momento da transferência.",
      },
    ],
  },
  {
    id: "produtos-encomendas",
    title: "Produtos e Encomendas",
    items: [
      {
        q: "Posso cancelar a minha encomenda?",
        a: "Contacte-nos o mais rapidamente possível através do email info@jocril.com ou telefone +351 21 471 89 03. Se a encomenda ainda não tiver sido expedida, poderemos proceder ao cancelamento.",
      },
      {
        q: "Os preços incluem IVA?",
        a: "Não. Todos os preços apresentados no website excluem IVA à taxa legal em vigor. O IVA é acrescentado no checkout.",
      },
      {
        q: "Posso juntar duas encomendas numa só?",
        a: "Não é possível consolidar duas encomendas distintas realizadas separadamente. Recomendamos agrupar o máximo de artigos numa única encomenda para otimizar os custos de envio.",
      },
      {
        q: "Como limpar peças de acrílico?",
        a: "Utilize apenas água e sabão neutro. Nunca utilize produtos que contenham álcool, pois podem danificar permanentemente o acrílico.",
      },
      {
        q: "Que tolerâncias existem nos produtos?",
        a: "Admite-se variação na espessura até 10% e diferenças na tonalidade impressa até 15%. Estas variações são normais no processo de fabrico e não constituem defeito.",
      },
    ],
  },
  {
    id: "conta-dados",
    title: "Conta e Dados Pessoais",
    items: [
      {
        q: "Como crio uma conta?",
        a: 'Clique em "Registar" no website e preencha os seus dados. Após aceitar os Termos e Condições, a sua conta ficará ativa.',
      },
      {
        q: "Como altero os meus dados pessoais?",
        a: "Pode alterar os seus dados diretamente na sua conta ou contactando-nos através do email info@jocril.com.",
      },
      {
        q: "Os meus dados estão protegidos?",
        a: "Sim. A Jocril cumpre integralmente o RGPD. Os seus dados destinam-se exclusivamente ao processamento de encomendas, comunicação e análise estatística.",
      },
      {
        q: "Posso eliminar a minha conta?",
        a: "Sim. Pode solicitar a eliminação da sua conta e dados pessoais através do email info@jocril.com.",
      },
    ],
  },
  {
    id: "suporte",
    title: "Suporte",
    items: [
      {
        q: "Como posso contactar-vos?",
        a: "Email: info@jocril.com | Telefone: +351 21 471 89 03 | Morada: Rua Sebastião e Silva 79, 2745-838 Massamá (Zona Industrial), Lisboa. Horário: Segunda a sexta-feira, das 9h às 13h e das 14h às 18h.",
      },
      {
        q: "Quanto tempo demoram a responder?",
        a: "Respondemos a pedidos de esclarecimento, reclamações e sugestões no prazo de 8 dias úteis.",
      },
      {
        q: "Tenho um litígio, o que faço?",
        a: "Em conformidade com a Lei nº 144/2015, qualquer litígio pode ser submetido ao Centro de Arbitragem de Conflitos de Consumo de Castelo Branco. Mais informações em www.centroarbitragemlisboa.pt.",
      },
    ],
  },
];

export default function FaqPage() {
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
        <section className="mt-10" aria-labelledby="faq-heading">
          <h1
            id="faq-heading"
            className={cn(
              "mb-6 text-2xl lg:text-3xl font-semibold",
              "tracking-[0.08em] lg:tracking-[0.1em]",
              "text-foreground font-mono uppercase"
            )}
          >
            Perguntas Frequentes
          </h1>
          <p className="mb-6 text-sm lg:text-base text-base-400 max-w-3xl">
            Encontre respostas rápidas sobre envios, devoluções, pagamentos, produtos, conta cliente e suporte.
            Se ainda tiver dúvidas, a nossa equipa está disponível para ajudar.
          </p>
        </section>

        {faqSections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="mt-8"
          >
            <h2
              id={section.id}
              className="mb-4 text-lg lg:text-xl font-semibold text-foreground"
            >
              {section.title}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {section.items.map((item, index) => {
                const itemId = `${section.id}-${index}`;
                return (
                  <AccordionItem key={itemId} value={itemId}>
                    <AccordionTrigger className="text-left text-sm lg:text-base font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm lg:text-base text-base-400 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        ))}

        {/* Entrega & Política de Envios (conteúdo de jocril_shipping.md) */}
        <section
          aria-labelledby="shipping-info"
          className="mt-12 border-t border-base-800/70 pt-8"
        >
          <h2
            id="shipping-info"
            className="mb-4 text-lg lg:text-xl font-semibold text-foreground"
          >
            Entrega & Política de Envios
          </h2>
          <p className="mb-3 text-sm lg:text-base text-base-400">
            As encomendas são normalmente expedidas no prazo de 2 dias após confirmação
            do pagamento e são transportadas através de serviço de transportadora com
            cobertura garantida.
          </p>
          <p className="mb-3 text-sm lg:text-base text-base-400">
            Independentemente da transportadora selecionada, disponibilizamos um link de
            rastreamento para acompanhamento online da sua encomenda.
          </p>
          <p className="mb-3 text-sm lg:text-base text-base-400">
            Os custos de envio incluem despesas de manuseamento, embalagem e transporte.
            As despesas de manuseamento são fixas, enquanto os custos de transporte variam
            conforme o peso total da encomenda. Recomendamos concentrar o maior número
            possível de artigos numa única encomenda.
          </p>
          <p className="mb-3 text-sm lg:text-base text-base-400">
            Não é possível consolidar duas encomendas distintas realizadas separadamente,
            sendo aplicadas taxas de envio individuais a cada uma delas.
          </p>
          <p className="mb-3 text-sm lg:text-base text-base-400">
            Todas as encomendas são despachadas com seguro de carga. Em caso de danos
            durante o transporte, dispõe de 24 horas para enviar evidência fotográfica dos
            danos, permitindo o envio de uma nova encomenda sem custos adicionais.
          </p>
          <p className="mb-0 text-sm lg:text-base text-base-400">
            Tomamos precauções especiais na proteção de objetos frágeis. As caixas são
            adequadamente dimensionadas e os seus artigos são devidamente protegidos.
          </p>
        </section>
      </main>
    </>
  );
}