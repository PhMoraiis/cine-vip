"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface FaqModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function FaqModal({ open, onOpenChange }: FaqModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto border-white/10 bg-[#0b0e13]">
				<DialogHeader>
					<DialogTitle className="font-bold text-2xl text-white">
						Como Funciona o OnCine?
					</DialogTitle>
					<DialogDescription className="text-white/60">
						Tudo que você precisa saber para criar seus cronogramas de cinema
						perfeitos
					</DialogDescription>
				</DialogHeader>

				<Accordion type="single" collapsible className="w-full">
					<AccordionItem value="item-1" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							O que é o OnCine?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							O OnCine é uma plataforma inteligente que ajuda você a criar
							cronogramas personalizados para assistir múltiplos filmes no
							cinema. Nosso sistema verifica automaticamente os horários
							disponíveis e sugere as melhores combinações para você aproveitar
							ao máximo sua experiência no cinema.
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-2" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							Como criar um cronograma?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							<ol className="list-inside list-decimal space-y-2">
								<li>Faça login na plataforma</li>
								<li>Selecione o cinema de sua preferência</li>
								<li>Escolha a data desejada</li>
								<li>Selecione os filmes que deseja assistir</li>
								<li>
									Clique em "Gerar Cronogramas" e veja as sugestões automáticas
								</li>
								<li>
									Escolha o cronograma que melhor se encaixa na sua agenda
								</li>
								<li>Salve e pronto! Seu cronograma está criado</li>
							</ol>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-3" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							O que são as configurações de flexibilidade?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							<p className="mb-3">
								As configurações de flexibilidade permitem que você personalize
								como o sistema calcula os cronogramas:
							</p>
							<ul className="space-y-2">
								<li>
									<strong className="text-white">Atraso Permitido:</strong>{" "}
									Quantos minutos você pode chegar atrasado ao início de um
									filme (padrão: 5 minutos)
								</li>
								<li>
									<strong className="text-white">Saída Antecipada:</strong>{" "}
									Quantos minutos antes do fim você pode sair de um filme
									(padrão: 5 minutos)
								</li>
								<li>
									<strong className="text-white">Intervalo Mínimo:</strong>{" "}
									Tempo mínimo entre filmes para deslocamento, banheiro, etc.
									(padrão: 5 minutos)
								</li>
							</ul>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-4" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							O que significa um cronograma "Viável" ou "Inviável"?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							<p className="mb-3">
								O sistema analisa automaticamente se é possível assistir todos
								os filmes selecionados:
							</p>
							<ul className="space-y-2">
								<li>
									<strong className="text-green-400">✓ Viável:</strong> Você
									consegue assistir todos os filmes sem conflitos de horário,
									considerando suas configurações de flexibilidade
								</li>
								<li>
									<strong className="text-red-400">✗ Inviável:</strong> Há
									conflitos de horário - algum filme termina tarde demais para
									você conseguir chegar ao próximo. O sistema mostra detalhes
									sobre o conflito para você entender o problema
								</li>
							</ul>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-5" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							Como o sistema detecta conflitos de horário?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							<p className="mb-3">
								O sistema faz um cálculo inteligente considerando:
							</p>
							<ol className="list-inside list-decimal space-y-2">
								<li>O horário de início e duração de cada filme</li>
								<li>Suas configurações de flexibilidade</li>
								<li>O tempo necessário entre filmes</li>
							</ol>
							<p className="mt-3">
								Por exemplo: Se um filme termina às 16:25 (com saída antecipada)
								e você precisa de 5 minutos de intervalo, você chegaria às 16:30
								no próximo filme. Se o próximo filme começa às 15:00 e aceita
								entrada até 15:05, há um conflito de 85 minutos!
							</p>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-6" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							Posso salvar meus cronogramas?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							Sim! Após gerar as sugestões de cronogramas, você pode selecionar
							o que mais gosta, dar um nome personalizado e salvá-lo. Todos os
							seus cronogramas salvos ficam disponíveis no seu Dashboard para
							consulta a qualquer momento.
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-7" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							Os horários são atualizados automaticamente?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							Sim! O sistema busca automaticamente os horários mais recentes
							diretamente dos sites dos cinemas. Quando você seleciona um cinema
							e data, verificamos se há informações atualizadas e, se
							necessário, buscamos os dados mais recentes para garantir que você
							tenha as sessões corretas.
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-8" className="border-white/10">
						<AccordionTrigger className="text-white hover:text-white/80">
							Quais cinemas estão disponíveis?
						</AccordionTrigger>
						<AccordionContent className="text-white/70">
							Atualmente, o OnCine suporta cinemas da rede Cineflix em diversas
							cidades. Estamos trabalhando para adicionar mais redes e cinemas
							em breve. Você pode ver todos os cinemas disponíveis ao criar um
							novo cronograma.
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
					<p className="text-sm text-white/70">
						<strong className="text-white">Dica:</strong> Para melhores
						resultados, selecione filmes com horários espaçados e ajuste as
						configurações de flexibilidade de acordo com suas preferências
						pessoais. Quanto mais flexível, mais opções de cronogramas viáveis
						você terá!
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
