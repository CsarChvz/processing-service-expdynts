variable "aws_region" {
  description = "Región de AWS para el laboratorio"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefijo para identificar los recursos"
  type        = string
  default     = "lab-pipes-final"
}

variable "database_url" {
  description = "URL de conexión a la base de datos"
  type        = string
  sensitive   = true
}