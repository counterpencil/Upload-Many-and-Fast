import Image from "next/image";
import FileUploader from "./FileUploader";

export default function Home() {
	return (
		<main className=" m-10 flex min-h-screen flex-col items-center  gap-4 p-30">
			<div className=" text-2xl">Many File Uploading [image/csv]</div>
			<FileUploader />
		</main>
	);
}
