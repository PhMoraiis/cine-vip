import { LoaderCircleIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduleNameStepProps {
	scheduleName: string;
	setScheduleName: (name: string) => void;
	onSave: () => void;
	isSaving: boolean;
	onBack: () => void;
}

export function ScheduleNameStep({
	scheduleName,
	setScheduleName,
	onSave,
	isSaving,
	onBack,
}: ScheduleNameStepProps) {
	const id = useId();

	return (
		<div className="mx-auto mt-16 max-w-md space-y-6">
			<div className="text-left">
				<h2 className="font-semibold text-white text-xl">Nome do Cronograma</h2>
				<p className="text-sm text-white/60">
					Dê um nome para salvar seu cronograma
				</p>
			</div>

			<div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
				<div className="space-y-2">
					<Label htmlFor={id} className="text-white">
						Nome
					</Label>
					<Input
						id={id}
						value={scheduleName}
						onChange={(e) => setScheduleName(e.target.value)}
						placeholder="Ex: Maratona Marvel"
						className="bg-black/20 text-white placeholder:text-white/20"
					/>
				</div>

				<div className="flex gap-3 pt-4">
					<Button
						variant="outline"
						onClick={onBack}
						className="flex-1 cursor-pointer text-white"
					>
						Voltar
					</Button>
					<Button
						onClick={onSave}
						disabled={!scheduleName.trim() || isSaving}
						className="flex-1 cursor-pointer bg-emerald-300/90 text-primary hover:bg-emerald-300/80"
					>
						{isSaving ? (
							<>
								<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
								Salvando...
							</>
						) : (
							"Salvar Cronograma"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
