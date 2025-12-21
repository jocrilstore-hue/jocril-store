"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function ContactoPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000))

        setSubmitted(true)
        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">Contacte-nos</h1>
                        <p className="text-lg text-muted-foreground">
                            Estamos aqui para ajudar. Entre em contacto connosco para qualquer questão sobre os nossos produtos ou serviços.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Envie-nos uma mensagem</CardTitle>
                                <CardDescription>
                                    Preencha o formulário abaixo e entraremos em contacto consigo brevemente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {submitted ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Mensagem enviada!</h3>
                                        <p className="text-muted-foreground">
                                            Obrigado pelo seu contacto. Responderemos em breve.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => setSubmitted(false)}
                                        >
                                            Enviar outra mensagem
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome *</Label>
                                                <Input id="name" name="name" required placeholder="O seu nome" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input id="email" name="email" type="email" required placeholder="email@exemplo.com" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input id="phone" name="phone" type="tel" placeholder="+351 912 345 678" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Assunto *</Label>
                                            <Input id="subject" name="subject" required placeholder="Assunto da mensagem" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Mensagem *</Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                required
                                                rows={5}
                                                placeholder="Escreva a sua mensagem aqui..."
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? "A enviar..." : "Enviar Mensagem"}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações de Contacto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Morada</h4>
                                            <p className="text-muted-foreground">
                                                Rua Elias Garcia, 28<br />
                                                2700-327 Amadora<br />
                                                Portugal
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Telefone</h4>
                                            <a href="tel:+351214718903" className="text-primary hover:underline">
                                                (+351) 21 471 89 03
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Email</h4>
                                            <a href="mailto:geral@jocril.pt" className="text-primary hover:underline">
                                                geral@jocril.pt
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Horário</h4>
                                            <p className="text-muted-foreground">
                                                Segunda a Sexta: 9h00 - 18h00<br />
                                                Sábado e Domingo: Fechado
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Map placeholder */}
                            <Card>
                                <CardContent className="p-0">
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                        <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3111.8889!2d-9.2331!3d38.7508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQ1JzAyLjkiTiA5wrAxMyczOS42Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0, minHeight: "300px" }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title="Localização Jocril"
                                            className="rounded-lg"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
