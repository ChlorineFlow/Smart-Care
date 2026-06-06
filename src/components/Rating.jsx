export default function Rating({ value, total = 5 }) {
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: total }).map((_, index) => {
				const filled = index < value;
				return (
					<span key={index} className={filled ? "text-yellow-500" : "text-gray-300"}>
						★
					</span>
				);
			})}
			<span className="ml-1 text-sm text-gray-600">{value}/{total}</span>
		</div>
	);
}
