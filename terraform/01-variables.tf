variable "aws_region" {
  description = "Región de AWS para el laboratorio"
  type        = string
  default     = "us-east-1"
}

variable "service_prefix" {
  description = "Prefijo para identificar los recursos"
  type        = string
  default     = "processing-service-expdynts"
}

data "aws_ssm_parameter" "db_url" {
  name = "/config/database_url"
}