'use client'

import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface Service {
  id: number
  slug: string
  title: string
  shortTitle: string
  description: string
  details: string
  image: string
}

const services: Service[] = [
  {
    id: 1,
    slug: "corte-laser",
    title: "Corte Laser de Precisão",
    shortTitle: "CORTE LASER",
    description: "Laser CO2 400W Trotec corta e grava até 3×2 metros.",
    details: "Acrílico até 30mm, madeira, dibond, metais. Precisão ao décimo de milímetro sem ferramentas adicionais.",
    image: "/images/digital.avif",
  },
  {
    id: 2,
    slug: "corte-fresa",
    title: "CNC com Troca Automática",
    shortTitle: "CORTE FRESA",
    description: "CNC com troca automática de ferramentas processa peças complexas em madeira, dibond e compósitos.",
    details: "Dimensões até 3×2 metros. Zero setup manual entre operações.",
    image: "/images/fresa.avif",
  },
  {
    id: 3,
    slug: "quinagem",
    title: "Quinagem de Acrílicos",
    shortTitle: "QUINAGEM",
    description: "Dobramos acrílicos de 0 a 180 graus com precisão angular.",
    details: "Peças únicas ou séries completas. Sem marcas, sem tensões residuais.",
    image: "/images/quinagem.avif",
  },
  {
    id: 4,
    slug: "moldagem",
    title: "Termomoldagem Industrial",
    shortTitle: "MOLDAGEM",
    description: "Túnel de termomoldagem até 60cm de largura. Forno 1,5×0,6m para formas complexas.",
    details: "Transformamos chapas planas em produtos tridimensionais por aquecimento controlado.",
    image: "/images/moldagem.avif",
  },
  {
    id: 5,
    slug: "gravacao",
    title: "Gravação a Laser",
    shortTitle: "GRAVAÇÃO",
    description: "Laser fibra para metais. CO2 para acrílicos e madeira.",
    details: "Gravação profunda ou superficial conforme especificação. Logotipos, texto, padrões complexos.",
    image: "/images/gravacao.avif",
  },
  {
    id: 6,
    slug: "serigrafia",
    title: "Serigrafia Industrial",
    shortTitle: "SERIGRAFIA",
    description: "Impressão cor a cor em rígidos e têxteis. Alta produção.",
    details: "Tintas opacas, resistentes a UV. De 50 a 50.000 unidades com consistência total.",
    image: "/images/serigrafia.avif",
  },
]

export const revalidate = 3600 // 1 hour

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative mx-auto grid h-auto w-full grid-cols-1 gap-x-4 lg:grid-cols-12 lg:gap-x-6 px-4 lg:px-9 lg:h-[calc((100dvh-160px)*0.7)] lg:max-h-[507px] lg:min-h-[434px] items-start lg:items-end bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/back2-mi.avif')`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="z-10 col-span-1 flex max-w-[650px] flex-col justify-start lg:col-span-6 lg:max-w-none lg:justify-end pb-12 lg:pb-20">
          <div className="flex flex-col gap-y-6 lg:gap-y-8 relative z-20">
            <h1 className="text-white text-4xl lg:text-5xl font-bold leading-tight lg:-ml-1">
              IDEIAS & PRECISÃO
            </h1>
            <div className="flex flex-col gap-y-4 lg:max-w-[600px] lg:gap-y-6">
              <p className="text-white text-base lg:text-lg text-pretty">
                Materiais para Ponto de Venda e Hotelaria em madeira e acrílico.
              </p>
              <p className="text-white text-base lg:text-lg text-pretty">
                Artigos feitos à medida em diversos materiais, incluindo Acrílico, Policarbonato, Dibond, PVC, Polietileno Tereftalato (PETg), Poliestireno (PS) e Polipropileno Alveolar (PPA), de forma a responder às necessidades dos nossos clientes Particulares e Empresas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative mx-auto grid w-full auto-rows-min grid-cols-1 gap-y-8 px-4 py-6 pb-8 lg:grid-cols-12 lg:gap-x-6 lg:px-9 lg:py-20 lg:pb-8 lg:min-h-screen">
        <div className="col-span-full mb-5 w-full pt-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-sm font-mono uppercase tracking-wide text-muted-foreground">Serviços</p>
          </div>
        </div>

        <div className="col-span-full lg:col-span-6 flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-balance">
              Processos Integrados
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground text-balance lg:max-w-[550px]">
              Equipamento industrial próprio. Cada processo otimizado para materiais técnicos. Do protótipo à série de 10.000 unidades com a mesma precisão.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="col-span-full grid grid-cols-1 gap-y-8 lg:gap-y-0">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-12 ${index !== services.length - 1 ? "border-b border-border" : ""
                }`}
            >
              {/* Content */}
              <div className={`lg:col-span-6 flex flex-col gap-y-4 ${index % 2 === 1 ? "lg:col-start-7 lg:order-2" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-primary">
                    {String(service.id).padStart(2, "0")}
                  </span>
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    {service.shortTitle}
                  </Badge>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {service.title}
                </h3>

                <div className="space-y-3 text-muted-foreground">
                  <p className="text-base">{service.description}</p>
                  <p className="text-base">{service.details}</p>
                </div>
              </div>

              {/* Image */}
              <div className={`lg:col-span-6 h-64 lg:h-80 relative overflow-hidden rounded-lg bg-muted ${index % 2 === 1 ? "lg:col-start-1 lg:order-1" : ""}`}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full bg-muted/50 px-4 py-16 lg:px-9">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Pronto para transformar a sua ideia em realidade?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Contacte-nos para discutir o seu projeto e descobrir como podemos ajudá-lo a alcançar a precisão que precisa.
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contacte-nos
          </a>
        </div>
      </section>
    </div>
  )
}
