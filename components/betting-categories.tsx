import Link from "next/link"
import {
  ClubIcon as Football,
  TurtleIcon as Tennis,
  ShoppingBasketIcon as Basketball,
  Dumbbell,
  Gamepad2,
  Zap,
  Clock,
} from "lucide-react"

export function BettingCategories() {
  const categories = [
    { name: "Football", icon: <Football className="h-4 w-4 mr-2" />, href: "/category/football" },
    { name: "Basketball", icon: <Basketball className="h-4 w-4 mr-2" />, href: "/category/basketball" },
    { name: "Tennis", icon: <Tennis className="h-4 w-4 mr-2" />, href: "/category/tennis" },
    { name: "MMA/Boxe", icon: <Dumbbell className="h-4 w-4 mr-2" />, href: "/category/fighting" },
    { name: "eSports", icon: <Gamepad2 className="h-4 w-4 mr-2" />, href: "/category/esports" },
  ]

  const quickLinks = [
    { name: "En Direct", icon: <Zap className="h-4 w-4 mr-2" />, href: "/live" },
    { name: "Bientôt", icon: <Clock className="h-4 w-4 mr-2" />, href: "/starting-soon" },
    // Lien "Tournois" supprimé
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Accès Rapide</h3>
        <nav className="space-y-1">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Sports</h3>
        <nav className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              {category.icon}
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
