"use client";
import React, { useState, ChangeEvent } from "react";
import axios, { AxiosError } from "axios";
export interface ErrorFileType {
	filename: string;
	message: string;
}
/**
 * 다량의 이미지 업로드 처리
 * chunk: 업로드 묶음 단위
 * CHUNK_SIZE: 한 번에 업로드할 chunk의 크기 -> 1개이면 비동기 단일 post, 여러개이면 개수만큼 묶어서 post
 * MAX_UPLOAD_CHUNK_NUMBER: 동시에 업로드할 최대 chunk 수
 * @returns
 */
const FileUploader: React.FC = () => {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [errorFiles, setErrorFiles] = useState<ErrorFileType[]>([]);
	const [active, setActive] = useState(true);
	const CHUNK_SIZE = 15;
	const MAX_UPLOAD_CHUNK_NUMBER = 10;
	const MAX_RETRY = 2;

	let progressIndex = 0;
	const resetParam = () => {
		setUploadProgress(0);
		setErrorFiles([]);
	};
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		resetParam();
		if (event.target.files) {
			setSelectedFiles(Array.from(event.target.files));
		}
	};

	const handleRefresh = () => {
		window.location.reload();
		resetParam();
		setActive(true);
	};

	const uploadChunk = async (chunk: File[], retry: number = 0) => {
		const formData = new FormData();
		//chunk가 배열이면 여러 파일 업로드, 아니면 단일 파일 업로드
		chunk.forEach((file) => formData.append("userfile", file));

		try {
			const response = await fetch("http://localhost:8888/uploads", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();
			if (response.status === 500) {
				console.log("ErrorFile", data.errorFiles);
				if (retry == 2) {
					data.errorFiles.forEach((file: ErrorFileType) => setErrorFiles((prev) => [...prev, { filename: `${file.filename}`, message: `${file.message}` }]));
				}
				if (retry < MAX_RETRY) {
					console.log(`재시도 (${retry + 1}/${MAX_RETRY})...`);
					await uploadChunk(chunk, retry + 1);
				} else {
					console.error("업로드 실패");
				}
			}
		} catch (error: any) {
			//chunk.forEach((file) => setErrorFiles({ filename: `${error?.errorFiles}`, message: `${error?.message}` }));
			console.error("업로드 실패:", error);
		}
	};
	const uploadInChunks = async (files: File[]) => {
		let activeUploads = 0;
		let nextChunkIndex = 0;

		const startNextChunk = async () => {
			if (nextChunkIndex < files.length && activeUploads < MAX_UPLOAD_CHUNK_NUMBER) {
				const chunk = files.slice(nextChunkIndex, nextChunkIndex + CHUNK_SIZE);
				nextChunkIndex += CHUNK_SIZE;
				activeUploads++;

				try {
					await uploadChunk(chunk);
					progressIndex += chunk.length;
					setUploadProgress((progressIndex / files.length) * 100);
				} catch (error) {
					console.error("Chunk upload error:", error);
				} finally {
					activeUploads--;
					startNextChunk(); // 다음 청크 시작
				}
			}

			if (nextChunkIndex >= files.length && activeUploads === 0) {
				console.log("전체업로드완료1");
				console.log("errorFiles2:", errorFiles);
				setActive(true);
			}
		};

		// 초기 청크들 시작
		for (let i = 0; i < MAX_UPLOAD_CHUNK_NUMBER && i * CHUNK_SIZE < files.length; i++) {
			startNextChunk();
		}
	};

	const handleUpload = () => {
		if (selectedFiles.length === 0) {
			alert("파일을 선택해주세요.");
			return;
		}
		setActive(false);
		uploadInChunks(selectedFiles);
	};

	return (
		<div>
			<input type="file" name="userfile" multiple onChange={handleFileChange} />
			<button
				onClick={handleUpload}
				className=" bg-gray-400 text-blue-50  p-3 pt-1 pb-1 rounded-md hover:bg-gray-600 hover:text-white disabled:bg-gray-300 disabled:text-white disabled:cursor-not-allowed"
				disabled={!active}
			>
				업로드
			</button>
			<button
				className="ml-4 bg-gray-400 text-blue-50  p-3 pt-1 pb-1 rounded-md hover:bg-gray-600 hover:text-white disabled:bg-gray-300 disabled:text-white disabled:cursor-not-allowed"
				onClick={() => {
					handleRefresh();
				}}
			>
				새로고침
			</button>
			{uploadProgress !== 100 && uploadProgress != 0 && <div>업로드 진행률: {Math.floor(uploadProgress)}%</div>}
			{uploadProgress === 100 && <div>업로드 완료</div>}
			<div>
				<div>
					{errorFiles
						? errorFiles.map((file) => (
								<div key={file?.filename + Date.now()} className=" border-t border-b border-spacing-1 border-dotted border-red-700 m-1 ml-0 text-red-900">
									<div>업로드 실패 파일명 : {file?.filename}</div>
									<div>업로드 실패 원인 : {file?.message} </div>
								</div>
						  ))
						: null}
				</div>
			</div>
		</div>
	);
};

export default FileUploader;
