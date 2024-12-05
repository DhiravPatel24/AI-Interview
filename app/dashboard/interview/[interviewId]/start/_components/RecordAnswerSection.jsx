"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
    const [userAnswer, setUserAnswer] = useState("");
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    const {
        results,
        isRecording,
        startSpeechToText,
        stopSpeechToText,
        setResults
    } = useSpeechToText({
        continuous: false,
        useLegacyResults: false
    });

    useEffect(() => {
        if (results?.length > 0) {
            const newTranscript = results.map(result => result.transcript).join(" ");
            setUserAnswer(prevAns => prevAns + newTranscript);
        }
    }, [results]);

    useEffect(() => {
        if (!isRecording && userAnswer?.length > 10) {
            updateUserAnswer();
        }
    }, [isRecording]);

    const startStopRecording = async () => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            startSpeechToText();
        }
    };

    const updateUserAnswer = async () => {
        if (!mockInterviewQuestion?.interviewQuestions[activeQuestionIndex]) {
            toast.error("No valid question found!");
            return;
        }

        setLoading(true);

        try {
            const feedbackPrompt = `Question: ${mockInterviewQuestion?.interviewQuestions[activeQuestionIndex]?.question}, User Answer: ${userAnswer}. Based on the question and user answer, please provide a rating and feedback as areas of improvement in JSON format with 'rating' and 'feedback' fields.`;

            const result = await chatSession.sendMessage(feedbackPrompt);
            const mockJsonResp = result.response.text().replace(/```json|```/g, "");
            const jsonFeedbackResp = JSON.parse(mockJsonResp);

            const resp = await db.insert(UserAnswer).values({
                mockId: interviewData?.mockId,
                question: mockInterviewQuestion?.interviewQuestions[activeQuestionIndex]?.question,
                correctAns: mockInterviewQuestion?.interviewQuestions[activeQuestionIndex]?.answer,
                userAns: userAnswer,
                feedback: jsonFeedbackResp?.feedback,
                rating: jsonFeedbackResp?.rating,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                createdAt: moment().format("YYYY-MM-DD")
            });

            if (resp) {
                toast.success("User answer recorded successfully!");
                setUserAnswer("");
                setResults([]);
            }
        } catch (error) {
            console.error("Error updating user answer:", error);
            toast.error("Failed to save user answer. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center flex-col">
            <div className="flex flex-col mt-20 justify-center items-center rounded-lg p-5">
                <Image src={"/webcam.png"} width={200} height={200} className="absolute" />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 500,
                        width: 500,
                        zIndex: 10
                    }}
                />
            </div>
            <Button
                disabled={loading}
                variant="outline"
                className="my-10"
                onClick={startStopRecording}
            >
                {isRecording ? (
                    <h2 className="text-red-600 animate-pulse flex gap-2 items-center">
                        <StopCircle /> Stop Recording
                    </h2>
                ) : (
                    <h2 className="text-primary flex gap-2 items-center">
                        <Mic /> Record Answer
                    </h2>
                )}
            </Button>
        </div>
    );
}

export default RecordAnswerSection;
