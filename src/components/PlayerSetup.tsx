import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";

type Player = {
    id: string;
    name: string;
};

type Stage = "setup" | "reveal" | "summary";

type Assignment = {
    player: Player;
    word: string;
    isImpostor: boolean;
};

const MIN_NAME_LENGTH = 2;
const DRAG_THRESHOLD_PX = 140;

// TODO: Sustituye esta lista por tus propias palabras cuando las tengas.
const WORDS = [
    "Playa",
    "Montaña",
    "Restaurante",
    "Cine",
    "Museo",
    "Fiesta",
    "Parque",
    "Supermercado",
    "Aeropuerto",
    "Biblioteca",
    "Momia",
    "Chincheta",
    "Isquio",
    "PingPong",
    "Padel",
    "Cafetería",
    "Taco Blindado",
    "Reloj de Temu",
    "Teatro",
    "Calentando",
    "Juan Antonio Trejo",
    "Gestión",
    "Personalidad",
    "Cine",
    "Karim Benzema",
    "Pedro Sánchez",
    "Camisas de 11 mangas",
    "Buggati",
    "Semafóro",
    "Vidreres",
    "Caja dientes",
    "Barril",
    "Hookah",
    "Asfaltar",


];

type RevealCardProps = {
    assignment: Assignment;
    position: number;
    total: number;
    onNext: () => void;
};

function RevealCard({ assignment, position, total, onNext }: RevealCardProps) {
    const [progress, setProgress] = useState(0);
    const [isPointerActive, setIsPointerActive] = useState(false);
    const [hasPeeked, setHasPeeked] = useState(false);
    const pointer = useRef<{ active: boolean; startY: number }>({
        active: false,
        startY: 0,
    });

    useEffect(() => {
        setProgress(0);
        setIsPointerActive(false);
        setHasPeeked(false);
        pointer.current = { active: false, startY: 0 };
    }, [assignment.player.id]);

    const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        pointer.current = {
            active: true,
            startY: event.clientY,
        };
        setIsPointerActive(true);
        setProgress(100);
        setHasPeeked(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!pointer.current.active) {
            return;
        }

        event.preventDefault();
        const delta = pointer.current.startY - event.clientY;
        const newProgress = Math.max(
            0,
            Math.min(100, (delta / DRAG_THRESHOLD_PX) * 100)
        );

        setProgress(newProgress);
    };

    const endDrag = (event?: ReactPointerEvent<HTMLDivElement>) => {
        if (pointer.current.active && event) {
            event.preventDefault();
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        pointer.current = { active: false, startY: 0 };
        setIsPointerActive(false);
        setProgress(0);
    };

    const showWord = isPointerActive;
    const wordColor = assignment.isImpostor
        ? "text-rose-400"
        : "text-slate-100";

    return (
        <div className="flex flex-col gap-6">
            <header className="text-center">
                <p className="text-sm uppercase tracking-wider text-slate-500">
                    Turno {position} de {total}
                </p>
                <h2 className="text-2xl font-bold text-slate-100">
                    {assignment.player.name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Pasa el dispositivo a esta persona. Mantén pulsado y desliza hacia
                    arriba para ver la palabra secreta.
                </p>
            </header>

            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
                <div className="min-h-[320px] px-8 py-10 text-center">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-600">
                        Palabra
                    </p>
                    <p
                        className={`mt-6 text-4xl font-black uppercase tracking-wide ${wordColor}`}
                        aria-live="polite"
                    >
                        {showWord ? assignment.word : ""}
                    </p>
                    {assignment.isImpostor && showWord && (
                        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-rose-400">
                            ¡Eres el impostor!
                        </p>
                    )}
                </div>

                <div
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 bg-slate-800 text-slate-200 shadow-inner transition-transform touch-none select-none"
                    style={{ transform: `translateY(-${progress}%)` }}
                    onPointerDown={beginDrag}
                    onPointerMove={updateDrag}
                    onPointerUp={endDrag}
                    onPointerLeave={endDrag}
                    onPointerCancel={endDrag}
                >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 text-2xl">
                        ↑
                    </span>
                    <p className="px-8 text-base font-semibold uppercase tracking-wider text-slate-100">
                        Desliza hacia arriba
                    </p>

                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!hasPeeked}
                    className="w-full max-w-sm rounded-lg bg-slate-100 px-6 py-3 text-base font-semibold text-slate-900 transition enabled:hover:bg-slate-200 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                    {position === total ? "Listo" : "Pasar al siguiente jugador"}
                </button>
                {!hasPeeked && (
                    <p className="text-xs text-slate-500">
                        El botón se activará después de levantar la tarjeta hasta el final.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PlayerSetup() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [nameInput, setNameInput] = useState("");
    const [error, setError] = useState("");
    const [stage, setStage] = useState<Stage>("setup");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleAddPlayer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = nameInput.trim();

        if (trimmedName.length < MIN_NAME_LENGTH) {
            setError(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres.`);
            return;
        }

        const isDuplicated = players.some(
            (player) => player.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicated) {
            setError("Ese nombre ya está en la lista.");
            return;
        }

        setPlayers((current) => [
            ...current,
            { id: crypto.randomUUID(), name: trimmedName },
        ]);
        setNameInput("");
        setError("");
    };

    const handleRemovePlayer = (id: string) => {
        setPlayers((current) => current.filter((player) => player.id !== id));
    };

    const handleStartGame = () => {
        if (players.length < 3) {
            setError("Necesitas al menos tres jugadores para comenzar.");
            return;
        }

        if (WORDS.length === 0) {
            setError("Necesitas definir al menos una palabra en la lista.");
            return;
        }

        const commonWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        const impostorIndex = Math.floor(Math.random() * players.length);

        const newAssignments = players.map((player, index) => ({
            player,
            isImpostor: index === impostorIndex,
            word: index === impostorIndex ? "IMPOSTOR" : commonWord,
        }));

        setAssignments(newAssignments);
        setCurrentIndex(0);
        setStage("reveal");
        setError("");
    };

    const advancePlayer = () => {
        if (currentIndex + 1 >= assignments.length) {
            setStage("summary");
            return;
        }

        setCurrentIndex((value) => value + 1);
    };

    const resetToSetup = () => {
        setStage("setup");
        setAssignments([]);
        setCurrentIndex(0);
    };

    const restartRound = () => {
        if (players.length < 3) {
            resetToSetup();
            return;
        }

        const commonWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        const impostorIndex = Math.floor(Math.random() * players.length);

        const newAssignments = players.map((player, index) => ({
            player,
            isImpostor: index === impostorIndex,
            word: index === impostorIndex ? "IMPOSTOR" : commonWord,
        }));

        setAssignments(newAssignments);
        setCurrentIndex(0);
        setStage("reveal");
    };

    const isReadyToPlay = players.length >= 3;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-slate-100 shadow-2xl backdrop-blur">
            {stage === "setup" && (
                <>
                    <header className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-extrabold text-slate-100">
                            Juego del Impostor
                        </h1>
                        <p className="text-sm text-slate-400">
                            Añade los nombres de todos los jugadores. Cuando empieces la
                            partida elegiremos una palabra secreta y un impostor al azar.
                        </p>
                    </header>

                    <form
                        onSubmit={handleAddPlayer}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="text"
                            placeholder="Nombre del jugador"
                            value={nameInput}
                            onChange={(event) => setNameInput(event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-base text-slate-100 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-slate-100 px-6 py-2 text-base font-medium text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Añadir
                        </button>
                    </form>

                    {error && (
                        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                            {error}
                        </p>
                    )}

                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-100">
                                Jugadores añadidos
                            </h2>
                            <span className="text-sm text-slate-400">
                                {players.length} jugador{players.length === 1 ? "" : "es"}
                            </span>
                        </div>

                        {players.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-800 bg-slate-900/70 px-4 py-8 text-center text-sm text-slate-500">
                                Todavía no hay jugadores. Añade al menos tres para comenzar.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {players.map((player) => (
                                    <li
                                        key={player.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2 shadow-sm"
                                    >
                                        <span className="text-base font-medium text-slate-100">
                                            {player.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePlayer(player.id)}
                                            className="rounded-md border px-3 py-1 text-sm font-medium text-white transition bg-red-500 focus:outline-none focus:ring-2"
                                        >
                                            Quitar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <footer className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950 px-6 py-5">
                        <span className="text-sm uppercase tracking-wide text-slate-500">
                            Siguiente paso
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-base text-slate-300">
                                Necesitas al menos tres jugadores para iniciar la partida.
                            </p>
                            <button
                                type="button"
                                onClick={handleStartGame}
                                disabled={!isReadyToPlay}
                                className="rounded-lg bg-slate-100 px-6 py-2 text-base font-semibold text-slate-900 transition enabled:hover:bg-slate-200 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                            >
                                Comenzar partida
                            </button>
                        </div>
                    </footer>
                </>
            )}

            {stage === "reveal" && assignments[currentIndex] && (
                <RevealCard
                    assignment={assignments[currentIndex]}
                    position={currentIndex + 1}
                    total={assignments.length}
                    onNext={advancePlayer}
                />
            )}

            {stage === "summary" && (
                <div className="flex flex-col gap-6 text-center">
                    <header className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-100">
                            ¡Todos listos!
                        </h2>
                        <p className="text-sm text-slate-400">
                            Ya puedes empezar la conversación y tratar de descubrir quién es
                            el impostor.
                        </p>
                    </header>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-6 py-5 text-left shadow-sm">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Jugadores en esta ronda
                        </h3>
                        <ul className="mt-3 grid gap-2 text-base text-slate-200 sm:grid-cols-2">
                            {players.map((player) => (
                                <li
                                    key={player.id}
                                    className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2 text-center font-medium"
                                >
                                    {player.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            onClick={restartRound}
                            className="rounded-lg bg-slate-100 px-6 py-3 text-base font-semibold text-slate-900 shadow-md transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Nueva palabra
                        </button>
                        <button
                            type="button"
                            onClick={resetToSetup}
                            className="rounded-lg border border-slate-700 bg-transparent px-6 py-3 text-base font-semibold text-slate-200 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-600"
                        >
                            Editar jugadores
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

