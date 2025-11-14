export interface GameState {
    id: string;
    status: 'waiting' | 'drawing' | 'guessing' | 'finished';
    currentPlayer: string;
    startTime?: Date;
    endTime?: Date;
    canvas: {
        width: number;
        height: number;
        imageData?: string;
    };
}
export interface AIGuessResponse {
    guess: string;
    confidence: number;
    processingTime: number;
    suggestions?: string[];
    success: boolean;
    error?: string;
}
export interface DrawingTool {
    type: 'brush' | 'eraser';
    color: string;
    size: number;
}
export interface GameConfig {
    canvasSize: {
        width: number;
        height: number;
    };
    timeLimit: number;
    maxGuesses: number;
    availableColors: string[];
    brushSizes: number[];
}
export interface Player {
    id: string;
    name: string;
    score: number;
    drawingsCompleted: number;
    guessesCorrect: number;
}
export interface AIServiceResponse {
    success: boolean;
    data?: {
        guess: string;
        confidence: number;
    };
    error?: {
        code: string;
        message: string;
    };
}
//# sourceMappingURL=game.d.ts.map